// Offscreen document: fetches the clicked image, runs it through the pipeline (lib/image.js, or a GIF
// or PDF writer), and writes to the chosen folder. This is the only file that makes a network request.

import { getFolder, folderPermission, writeUnique } from "./lib/folder.js";
import { JobError } from "./lib/job-error.js";
import { GIF_LIMITS, nameFromUrl } from "./lib/settings.js";
import { decode, draw, encodeCanvas, fitWidth, processImage, sniffImageType, verifyOutput } from "./lib/image.js";
import { gifSize, openAnimation, stillFrame, checkLimits, fitGif, encodeGif } from "./lib/gif.js";
import { buildPdf, splitAlpha, deflate } from "./lib/pdf.js";

// Per job: the fetched source (so More options can preview many times with one download)
// and the converted file waiting to be saved. Both are dropped when the job ends, or after 10 minutes.
const sources = new Map();
const pending = new Map();
const KEEP_MS = 10 * 60 * 1000;

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
  const blob = await res.blob();
  if (!blob.size) throw new JobError("decode"); // an empty answer is never saved as a file
  return blob;
}

function remember(map, jobId, entry) {
  forget(map, jobId);
  entry.timer = setTimeout(() => forget(map, jobId), KEEP_MS);
  map.set(jobId, entry);
}

function forget(map, jobId) {
  const entry = map.get(jobId);
  if (!entry) return;
  clearTimeout(entry.timer);
  if (entry.blobUrl) URL.revokeObjectURL(entry.blobUrl);
  map.delete(jobId);
}

async function sourceFor(jobId, url) {
  const cached = sources.get(jobId);
  if (cached?.url === url) return cached.blob;
  const blob = await fetchImage(url);
  remember(sources, jobId, { url, blob });
  return blob;
}

// PNG, JPG and WebP.
async function still(input, opts) {
  const image = await decode(input);
  try {
    return await processImage(image, { ...opts, type: opts.mime });
  } finally {
    image.done();
  }
}

// GIF output. A GIF stays exactly as it is; animated WebP/AVIF/APNG are re-encoded frame by frame;
// a still image becomes a one-frame GIF.
async function animate(input, { maxWidth }) {
  const type = await sniffImageType(input);
  if (type === "image/gif") {
    const { width, height } = await gifSize(input);
    return { blob: new Blob([input], { type: "image/gif" }), width, height, sourceWidth: width, sourceHeight: height };
  }
  const deadline = Date.now() + GIF_LIMITS.timeoutMs;
  const animation = await openAnimation(input, type);
  if (animation) {
    try {
      checkLimits(animation);
      const size = fitGif(animation.width, animation.height, maxWidth);
      const blob = await encodeGif(animation.frames(), { ...size, deadline });
      return { blob, ...size, sourceWidth: animation.width, sourceHeight: animation.height };
    } finally {
      animation.close();
    }
  }
  const image = await decode(input);
  try {
    const size = fitGif(image.width, image.height, maxWidth);
    const blob = await encodeGif(stillFrame(image.source), { ...size, deadline });
    return { blob, ...size, sourceWidth: image.width, sourceHeight: image.height };
  } finally {
    image.done();
  }
}

// PDF output: one page, exactly the image. Opaque images are stored as JPEG (small), images with
// transparency losslessly with an alpha mask. Animated images use their first frame, like PNG and JPG.
async function toPdf(input, { url, quality, maxWidth }) {
  const image = await decode(input);
  let canvas;
  try {
    const { width, height } = fitWidth(image.width, image.height, maxWidth);
    canvas = draw(image, { width, height });
    let rgba;
    try {
      rgba = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, width, height).data;
    } catch {
      throw new JobError("too-large");
    }
    const { rgb, alpha } = splitAlpha(rgba);
    const pdfImage = alpha
      ? { rgb: await deflate(rgb), alpha: await deflate(alpha) }
      : { jpeg: new Uint8Array(await (await encodeCanvas(canvas, "image/jpeg", quality)).arrayBuffer()) };
    const title = nameFromUrl(url); // "image" for data: URLs
    const blob = buildPdf({ width, height, image: pdfImage, title });
    return { blob, width, height, sourceWidth: image.width, sourceHeight: image.height };
  } finally {
    if (canvas) canvas.width = canvas.height = 0;
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

// Data URLs stay small enough for chrome.downloads; bigger files use a blob: URL kept alive here.
const DATA_URL_LIMIT = 1.5 * 1024 * 1024;

const handlers = {
  // msg: { jobId, sourceId?, url, mime, quality, background, maxWidth, maxBytes, minQuality, want: "url" | "data" | "none" }
  // sourceId: reuse the image a window already fetched (More options, Copy as PNG).
  async convert(msg) {
    const input = await sourceFor(msg.sourceId || msg.jobId, msg.url);
    const make = msg.mime === "image/gif" ? animate : msg.mime === "application/pdf" ? toPdf : still;
    const out = await make(input, msg);
    // Whatever made it, the file must really be the type it will be named as.
    const ext = await verifyOutput(out.blob, msg.mime);
    const entry = { blob: out.blob };
    remember(pending, msg.jobId, entry);
    const result = {
      width: out.width,
      height: out.height,
      sourceWidth: out.sourceWidth,
      sourceHeight: out.sourceHeight,
      quality: out.quality ?? null,
      mime: out.blob.type,
      ext,
      size: out.blob.size,
    };
    if (msg.want === "data") result.dataUrl = await toDataUrl(out.blob);
    if (msg.want === "url") {
      if (out.blob.size <= DATA_URL_LIMIT) result.url = await toDataUrl(out.blob);
      else result.url = entry.blobUrl = URL.createObjectURL(out.blob);
    }
    return result;
  },

  // Write a converted file straight into the chosen folder, if the browser still allows it.
  async write({ jobId, dirs, name, ext }) {
    const entry = pending.get(jobId);
    if (!entry) throw new JobError("expired");
    const handle = await getFolder();
    if (!handle) return { ok: false, code: "no-folder" };
    if ((await folderPermission(handle)) !== "granted") return { ok: false, code: "folder-permission", folderName: handle.name };
    try {
      const path = await writeUnique(handle, dirs, name, ext, entry.blob);
      forget(pending, jobId);
      return { path, folderName: handle.name };
    } catch (e) {
      throw new JobError("write", e.message);
    }
  },

  // Hand a pending file to an extension window (folder writes, the clipboard).
  async take({ jobId }) {
    const entry = pending.get(jobId);
    if (!entry) throw new JobError("expired");
    return { dataUrl: await toDataUrl(entry.blob), mime: entry.blob.type };
  },

  // The converted file (a download finished), and/or the fetched source (all: the job is over).
  async release({ jobId, all, pending: file = true }) {
    if (file) forget(pending, jobId);
    if (all) forget(sources, jobId);
    return {};
  },

  // For tests: how many files and sources are held right now.
  async count() {
    return { pending: pending.size, sources: sources.size };
  },
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.target !== "offscreen" || !handlers[msg.type] || sender.id !== chrome.runtime.id) return false;
  handlers[msg.type](msg)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((e) => sendResponse({ ok: false, code: e.code || "unknown", detail: e.detail || e.message || "", subs: e.subs }));
  return true; // respond asynchronously
});
