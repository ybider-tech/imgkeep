// Offscreen document: fetches the clicked image, converts it (lib/convert.js, shared with the website's
// converter), and writes to the chosen folder. This is the only file that makes a network request.

import { getFolder, folderPermission, writeUnique } from "./lib/folder.js";
import { JobError } from "./lib/job-error.js";
import { convert } from "./lib/convert.js";

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

// The AVIF encoder (vendor/avif), loaded the first time someone saves as AVIF. Its .wasm file is read from
// inside the extension here and handed over, so the encoder's own loader never fetches anything.
let avifEncoder = null;
function loadAvifEncoder() {
  avifEncoder ??= (async () => {
    const wasmBinary = await (await fetch(chrome.runtime.getURL("vendor/avif/avif_enc.wasm"))).arrayBuffer();
    const { default: factory } = await import("./vendor/avif/avif_enc.js");
    return factory({ wasmBinary, noInitialRun: true });
  })().catch((e) => {
    avifEncoder = null; // try again next time
    throw e;
  });
  return avifEncoder;
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
    const out = await convert(input, { ...msg, avifEncoder: loadAvifEncoder });
    const entry = { blob: out.blob };
    remember(pending, msg.jobId, entry);
    const result = {
      width: out.width,
      height: out.height,
      sourceWidth: out.sourceWidth,
      sourceHeight: out.sourceHeight,
      quality: out.quality,
      mime: out.blob.type,
      ext: out.ext,
      size: out.blob.size,
      sourceType: out.sourceType, // for the anonymous counts: "image/webp" → JPG
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
