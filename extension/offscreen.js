// Offscreen document: fetches the clicked image, converts it (lib/convert.js, shared with the website's
// converter), and writes to the chosen folder. This is the only file that makes a network request.

import { getFolder, folderPermission, writeUnique } from "./lib/folder.js";
import { IS_FIREFOX } from "./lib/browser.js";
import { JobError } from "./lib/job-error.js";
import { convert } from "./lib/convert.js";
import { decode, draw, fitWidth, sniffImageType } from "./lib/image.js";
import { PALETTE_COUNTS, PALETTE_SAMPLE, cleanHexes, extractPalette, toAse, toGpl } from "./lib/palette.js";

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

// The longer side fitted to `max`, keeping the shape.
function fitLongest(width, height, max) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function pixels(canvas) {
  try {
    return canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data;
  } catch {
    throw new JobError("too-large");
  }
}

// A swatch strip: one block per colour, its HEX value printed underneath. 1200 px wide.
async function swatchStrip(hexes) {
  const width = 1200;
  const block = width / hexes.length;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = 380;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, canvas.height);
  const size = Math.min(26, Math.floor(block / 4.6));
  ctx.font = `600 ${size}px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  hexes.forEach((hex, i) => {
    const x = Math.round(i * block);
    ctx.fillStyle = hex;
    ctx.fillRect(x, 0, Math.round((i + 1) * block) - x, 300);
    ctx.fillStyle = "#1C2321";
    ctx.fillText(hex, x + block / 2, 340);
  });
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  canvas.width = canvas.height = 0;
  if (!blob) throw new JobError("too-large");
  return blob;
}

const PALETTE_FILES = {
  png: async (hexes) => swatchStrip(hexes),
  // octet-stream for both: with text/plain the browser renames a .gpl download to .txt.
  gpl: async (hexes, name) => new Blob([toGpl(hexes, name)], { type: "application/octet-stream" }),
  ase: async (hexes) => new Blob([toAse(hexes)], { type: "application/octet-stream" }),
};

// Data URLs stay small enough for chrome.downloads; bigger files use a blob: URL kept alive here.
// Firefox always gets a blob: URL (its downloads API doesn't take data: URLs).
const DATA_URL_LIMIT = IS_FIREFOX ? 0 : 1.5 * 1024 * 1024;

// A URL for chrome.downloads: a data: URL when small, otherwise a blob: URL kept with the entry.
async function downloadUrl(entry) {
  if (entry.blob.size <= DATA_URL_LIMIT) return toDataUrl(entry.blob);
  return (entry.blobUrl = URL.createObjectURL(entry.blob));
}

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
    if (msg.want === "url") result.url = await downloadUrl(entry);
    return result;
  },

  // The image's main colours, for 5, 8 and 12 at once (switching in the window needs no new request),
  // and a small preview of the image, so the window never loads it from the web itself.
  async palette({ jobId, url }) {
    const input = await sourceFor(jobId, url);
    const image = await decode(input);
    let sample;
    let thumb;
    try {
      sample = draw(image, fitLongest(image.width, image.height, PALETTE_SAMPLE));
      const data = pixels(sample);
      const palettes = Object.fromEntries(PALETTE_COUNTS.map((n) => [n, extractPalette(data, n)]));
      thumb = draw(image, fitWidth(image.width, image.height, 800));
      const preview = await new Promise((resolve) => thumb.toBlob(resolve, "image/webp", 0.85));
      return {
        palettes,
        width: image.width,
        height: image.height,
        thumb: preview ? await toDataUrl(preview) : "",
        sourceType: await sniffImageType(input),
      };
    } finally {
      for (const c of [sample, thumb]) if (c) c.width = c.height = 0;
      image.done();
    }
  },

  // A palette as a file (PNG swatch strip, .gpl or .ase), held like a converted image until it's saved.
  // The window sends only colours ("#RRGGBB"), never bytes.
  async swatchFile({ jobId, kind, hexes, name, want }) {
    const clean = cleanHexes(hexes);
    if (!PALETTE_FILES[kind] || !clean.length) throw new JobError("unknown");
    const blob = await PALETTE_FILES[kind](clean, name);
    const entry = { blob };
    remember(pending, jobId, entry);
    const result = { ext: kind, size: blob.size };
    if (want === "url") result.url = await downloadUrl(entry);
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

// One request → { ok: true, ...result } or { ok: false, code, detail, subs }.
export function handle(msg) {
  if (!Object.hasOwn(handlers, msg?.type)) return Promise.resolve({ ok: false, code: "unknown", detail: `Unknown request ${msg?.type}` });
  return handlers[msg.type](msg)
    .then((result) => ({ ok: true, ...result }))
    .catch((e) => ({ ok: false, code: e.code || "unknown", detail: e.detail || e.message || "", subs: e.subs }));
}

// Chrome and Edge: requests arrive as messages from the service worker. (Firefox's background page imports
// this file and calls handle() itself.)
if (location.pathname.endsWith("/offscreen.html")) {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.target !== "offscreen" || !Object.hasOwn(handlers, msg.type) || sender.id !== chrome.runtime.id) return false;
    handle(msg).then(sendResponse);
    return true; // respond asynchronously
  });
}
