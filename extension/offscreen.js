// Offscreen document: fetches the clicked image, converts it on a canvas,
// and writes to the chosen folder. This is the only file that makes a network request.

import { getFolder, folderPermission, writeUnique } from "./lib/folder.js";

// Converted files waiting to be saved, by job id. Dropped after 10 minutes at most.
const pending = new Map();
const KEEP_MS = 10 * 60 * 1000;

class JobError extends Error {
  constructor(code, detail = "") {
    super(code);
    this.code = code;
    this.detail = detail;
  }
}

// Only the image the user clicked is ever requested.
async function fetchImage(url) {
  let res;
  try {
    res = await fetch(url, { credentials: "include" });
  } catch {
    try {
      res = await fetch(url, { credentials: "omit" });
    } catch {
      throw new JobError("blocked");
    }
  }
  if (!res.ok) throw new JobError("http", String(res.status));
  return res.blob();
}

async function looksLikeSvg(blob) {
  if (blob.type === "image/svg+xml") return true;
  const head = await blob.slice(0, 512).text();
  return /<svg[\s>]/i.test(head);
}

// Returns { source, width, height, done() } ready for drawImage.
async function decode(blob) {
  try {
    const bmp = await createImageBitmap(blob);
    return { source: bmp, width: bmp.width, height: bmp.height, done: () => bmp.close() };
  } catch {
    // SVG (and anything createImageBitmap refuses) goes through <img>.
  }
  if (await looksLikeSvg(blob)) blob = new Blob([blob], { type: "image/svg+xml" });
  const src = URL.createObjectURL(blob);
  const img = new Image();
  img.src = src;
  try {
    await img.decode();
  } catch {
    URL.revokeObjectURL(src);
    throw new JobError("decode");
  }
  let width = img.naturalWidth;
  let height = img.naturalHeight;
  if (!width || !height) {
    // SVG without an intrinsic size: use its viewBox shape at 1024px wide.
    const ratio = width && height ? height / width : 0.5;
    width = 1024;
    height = Math.round(1024 * ratio);
  }
  return { source: img, width, height, done: () => URL.revokeObjectURL(src) };
}

async function convert({ url, mime, quality, background }) {
  const input = await fetchImage(url);
  const image = await decode(input);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    if (mime === "image/jpeg") {
      // JPG has no transparency: paint the chosen background first.
      ctx.fillStyle = background || "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(image.source, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, quality / 100));
    if (!blob) throw new JobError("too-large");
    if (blob.type !== mime) throw new JobError("unsupported");
    return { blob, width: image.width, height: image.height };
  } finally {
    image.done();
  }
}

function toDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function keep(jobId, entry) {
  release(jobId);
  entry.timer = setTimeout(() => release(jobId), KEEP_MS);
  pending.set(jobId, entry);
}

function release(jobId) {
  const entry = pending.get(jobId);
  if (!entry) return;
  clearTimeout(entry.timer);
  if (entry.blobUrl) URL.revokeObjectURL(entry.blobUrl);
  pending.delete(jobId);
}

// Data URLs stay small enough for chrome.downloads; bigger files use a blob: URL kept alive here.
const DATA_URL_LIMIT = 1.5 * 1024 * 1024;

const handlers = {
  async convert(msg) {
    const { blob, width, height } = await convert(msg);
    const entry = { blob };
    keep(msg.jobId, entry);
    const result = { width, height, mime: blob.type, size: blob.size };
    if (msg.want === "url") {
      if (blob.size <= DATA_URL_LIMIT) result.url = await toDataUrl(blob);
      else result.url = entry.blobUrl = URL.createObjectURL(blob);
    }
    return result;
  },

  // Write a converted file straight into the chosen folder, if Chrome still allows it.
  async write({ jobId, dirs, name, ext }) {
    const entry = pending.get(jobId);
    if (!entry) throw new JobError("expired");
    const handle = await getFolder();
    if (!handle) return { ok: false, code: "no-folder" };
    if ((await folderPermission(handle)) !== "granted") return { ok: false, code: "folder-permission", folderName: handle.name };
    try {
      const path = await writeUnique(handle, dirs, name, ext, entry.blob);
      release(jobId);
      return { path, folderName: handle.name };
    } catch (e) {
      throw new JobError("write", e.message);
    }
  },

  // Hand a pending file to the ask window.
  async take({ jobId }) {
    const entry = pending.get(jobId);
    if (!entry) throw new JobError("expired");
    return { dataUrl: await toDataUrl(entry.blob) };
  },

  async release({ jobId }) {
    release(jobId);
    return {};
  },
};

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.target !== "offscreen" || !handlers[msg.type]) return false;
  handlers[msg.type](msg)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((e) => sendResponse({ ok: false, code: e.code || "unknown", detail: e.detail || e.message || "" }));
  return true; // respond asynchronously
});
