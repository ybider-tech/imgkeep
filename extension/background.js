// Service worker: context menu, save jobs, and the extension's small windows
// (ask: a save needs your OK; copy: Copy as PNG; editor: More options).

import { FORMATS, GIF_LIMITS, getSettings, buildTarget, targetPath, extFromUrl, clampQuality, cleanColour } from "./lib/settings.js";
import { cleanMaxWidth } from "./lib/image.js";
import { JobError } from "./lib/job-error.js";

const msg = (key) => chrome.i18n.getMessage(key);

const MENU = {
  "imgkeep-png": "png",
  "imgkeep-jpg": "jpg",
  "imgkeep-webp": "webp",
  "imgkeep-gif": "gif",
  "imgkeep-pdf": "pdf",
  "imgkeep-original": "original",
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    const contexts = ["image"];
    const item = (id, title, type) => chrome.contextMenus.create({ id, parentId: "imgkeep", title, type, contexts });
    chrome.contextMenus.create({ id: "imgkeep", title: msg("menuParent"), contexts });
    item("imgkeep-png", "PNG");
    item("imgkeep-jpg", "JPG");
    item("imgkeep-webp", "WebP");
    item("imgkeep-gif", msg("menuGif"));
    item("imgkeep-pdf", "PDF");
    item("imgkeep-sep", undefined, "separator");
    item("imgkeep-original", msg("menuOriginal"));
    item("imgkeep-sep2", undefined, "separator");
    item("imgkeep-copy", msg("menuCopyPng"));
    item("imgkeep-more", msg("menuMoreOptions"));
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (!info.srcUrl) return;
  const input = { url: info.srcUrl, pageUrl: info.pageUrl };
  if (info.menuItemId === "imgkeep-copy") return openWindow("copy", input);
  if (info.menuItemId === "imgkeep-more") return openWindow("editor", input);
  const format = MENU[info.menuItemId];
  if (format) runJob({ ...input, format });
});

// ---- Offscreen document (created on demand) ----

let creating = null;

async function ensureOffscreen() {
  const url = chrome.runtime.getURL("offscreen.html");
  const existing = await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"], documentUrls: [url] });
  if (existing.length) return;
  creating ??= chrome.offscreen
    .createDocument({ url: "offscreen.html", reasons: ["BLOBS"], justification: "Convert the image you chose on this computer." })
    .finally(() => (creating = null));
  await creating;
}

// The converter stops long GIF encodes itself; this is a backstop so a save can never wait forever.
const OFFSCREEN_TIMEOUT_MS = GIF_LIMITS.timeoutMs + 30_000;

async function toOffscreen(msg) {
  await ensureOffscreen();
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve({ ok: false, code: "timeout" }), OFFSCREEN_TIMEOUT_MS);
  });
  try {
    const res = await Promise.race([chrome.runtime.sendMessage({ target: "offscreen", ...msg }), timeout]);
    return res || { ok: false, code: "unknown", detail: "No answer from the converter" };
  } finally {
    clearTimeout(timer);
  }
}

// Drop a job's converted file (and its source, with source: true) without starting the offscreen document just for that.
async function releaseIfOpen(jobId, { source = false } = {}) {
  const url = chrome.runtime.getURL("offscreen.html");
  const open = await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"], documentUrls: [url] });
  if (open.length) await chrome.runtime.sendMessage({ target: "offscreen", type: "release", jobId, all: source });
}

async function dropSource(jobId) {
  const url = chrome.runtime.getURL("offscreen.html");
  const open = await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"], documentUrls: [url] });
  if (open.length) await chrome.runtime.sendMessage({ target: "offscreen", type: "release", jobId, pending: false, all: true }).catch(() => {});
}

// Blob URLs handed to chrome.downloads must stay alive until the download ends.
const blobDownloads = new Map(); // downloadId -> jobId

chrome.downloads.onChanged.addListener((delta) => {
  const jobId = blobDownloads.get(delta.id);
  const state = delta.state?.current;
  if (jobId && (state === "complete" || state === "interrupted")) {
    blobDownloads.delete(delta.id);
    releaseIfOpen(jobId);
  }
});

// ---- Jobs ----
// job: { id, url, format, pageUrl, options?, sourceId? }
//   options: choices from More options ({ maxWidth, quality, background, name }) instead of the saved settings.
//   sourceId: the window job whose fetched image this job reuses (More options saves and copies).

function originPattern(url) {
  const u = new URL(url);
  return `${u.protocol}//${u.hostname}/*`; // match patterns cover every port of the host
}

async function download({ url, filename, saveAs }) {
  const opts = { url, conflictAction: "uniquify", saveAs };
  if (filename) opts.filename = filename;
  try {
    return await chrome.downloads.download(opts);
  } catch (e) {
    throw new JobError("download", e.message);
  }
}

// Settings, with More options' choices on top.
function choicesFor(job, settings) {
  const o = job.options || {};
  const quality = job.format === "webp" ? settings.webpQuality : settings.jpgQuality; // PDF photos use JPG quality
  return {
    quality: o.quality ?? quality,
    background: o.background ?? settings.jpgBackground,
    maxWidth: o.maxWidth ?? settings.maxWidth,
    // File-size cap (JPG and WebP). In the pipeline and tested, but not offered in the UI yet: it's planned for Pro.
    maxBytes: o.maxBytes,
    minQuality: o.minQuality,
  };
}

function convertJob(job, settings, want) {
  return toOffscreen({
    type: "convert",
    jobId: job.id,
    sourceId: job.sourceId,
    url: job.url,
    mime: FORMATS[job.format].mime,
    ...choicesFor(job, settings),
    want,
  });
}

// A failed conversion → what the window should show. Blocked sites get the "allow this site?" question.
async function failure(job, conv) {
  if (conv.code === "blocked" && /^https?:/.test(job.url)) {
    const origin = originPattern(job.url);
    const allowed = await chrome.permissions.contains({ origins: [origin] });
    if (!allowed) return { ok: false, reason: "host", origin, host: new URL(job.url).hostname };
  }
  return { ok: false, reason: "error", code: conv.code, detail: conv.detail, detailSubs: conv.subs };
}

// "Original format" always goes through chrome.downloads, untouched.
async function saveOriginal(job, settings) {
  if (job.url.startsWith("blob:")) return { ok: false, reason: "error", code: "blob" };
  const ext = extFromUrl(job.url);
  // Unknown type: let the browser name the file from the server's answer.
  const filename = ext ? targetPath(buildTarget({ settings, url: job.url, ext })) : "";
  const downloadId = await download({ url: job.url, filename, saveAs: settings.saveMode === "ask" });
  return { ok: true, mode: "downloads", downloadId, filename };
}

async function attempt(job) {
  const settings = await getSettings();
  if (job.format === "original") return saveOriginal(job, settings);
  if (!FORMATS[job.format]) throw new JobError("unknown", `Unknown format ${job.format}`);
  if (job.url.startsWith("blob:")) return { ok: false, reason: "error", code: "blob" };

  const mode = settings.saveMode;
  const conv = await convertJob(job, settings, mode === "folder" ? "none" : "url");
  if (!conv.ok) return failure(job, conv);

  // The extension comes from the checked output bytes, never from the menu item alone.
  const target = buildTarget({ settings, url: job.url, width: conv.width, height: conv.height, ext: conv.ext, name: job.options?.name });
  const size = { width: conv.width, height: conv.height, mime: conv.mime, bytes: conv.size };

  if (mode === "folder") {
    const w = await toOffscreen({ type: "write", jobId: job.id, ...target });
    if (w.ok) return { ok: true, mode, path: w.path, ...size };
    if (w.code === "no-folder" || w.code === "folder-permission") {
      return { ok: false, reason: w.code, folderName: w.folderName || "", target };
    }
    return { ok: false, reason: "error", code: w.code, detail: w.detail, detailSubs: w.subs };
  }

  const filename = targetPath(target);
  const downloadId = await download({ url: conv.url, filename, saveAs: mode === "ask" });
  if (conv.url.startsWith("blob:")) blobDownloads.set(downloadId, job.id);
  else releaseIfOpen(job.id);
  return { ok: true, mode, downloadId, filename, ...size };
}

// Runs one save. If it needs the user's decision, opens the ask window (unless interactive is false).
async function runJob(input, { interactive = true } = {}) {
  const job = {
    id: input.id || crypto.randomUUID(),
    url: input.url,
    format: input.format,
    pageUrl: input.pageUrl || "",
    options: input.options,
    sourceId: input.sourceId,
  };
  let result;
  try {
    result = await attempt(job);
  } catch (e) {
    result = { ok: false, reason: "error", code: e.code || "unknown", detail: e.detail || e.message || "" };
  }
  result.jobId = job.id;
  // Once a save has its answer, the fetched image isn't needed (a retry fetches again). A window's image
  // stays until the window closes. A converted file waiting for a download or a folder stays too.
  if (!job.sourceId) await dropSource(job.id);
  if (!result.ok && interactive) await openAsk({ ...job, ...result });
  return result;
}

// For automated tests only.
globalThis.imgkeepRunJob = runJob;

// ---- Windows ----

const jobKey = (id) => `job:${id}`;

const WINDOWS = {
  ask: { width: 480, height: 380 },
  copy: { width: 400, height: 220 },
  editor: { width: 600, height: 780 },
};

async function openWindow(page, input) {
  const job = { id: crypto.randomUUID(), pageUrl: "", ...input };
  await chrome.storage.session.set({ [jobKey(job.id)]: job });
  await chrome.windows.create({
    url: chrome.runtime.getURL(`${page}.html?job=${encodeURIComponent(job.id)}`),
    type: "popup",
    ...WINDOWS[page],
    focused: true, // the clipboard only takes images from a focused window
  });
  return job.id;
}

const openAsk = (job) => openWindow("ask", job);

// For automated tests only.
globalThis.imgkeepOpenWindow = openWindow;

async function loadJob(jobId) {
  const key = jobKey(jobId);
  const stored = await chrome.storage.session.get(key);
  if (!stored[key]) throw new JobError("expired");
  return stored[key];
}

async function finishJob(jobId) {
  await chrome.storage.session.remove(jobKey(jobId));
  await releaseIfOpen(jobId, { source: true });
}

// More options' choices, checked: windows can only pick from what the UI offers.
function cleanOptions(o = {}) {
  const out = {};
  if (o.maxWidth !== undefined) out.maxWidth = cleanMaxWidth(o.maxWidth);
  if (o.quality !== undefined) out.quality = clampQuality(o.quality, 92);
  if (o.background !== undefined) out.background = cleanColour(o.background);
  if (o.name !== undefined) out.name = String(o.name).slice(0, 200);
  return out;
}

const WINDOW_FORMATS = ["png", "jpg", "webp"];

// Converts a window's image without saving it and returns the file as a data: URL (preview, clipboard).
async function convertForWindow(jobId, format, options) {
  if (!WINDOW_FORMATS.includes(format)) throw new JobError("unknown", `Unknown format ${format}`);
  const job = await loadJob(jobId);
  if (job.url.startsWith("blob:")) return { ok: false, reason: "error", code: "blob" };
  const run = { id: crypto.randomUUID(), sourceId: jobId, url: job.url, format, options: cleanOptions(options) };
  const conv = await convertJob(run, await getSettings(), "data");
  releaseIfOpen(run.id);
  return conv.ok ? conv : failure(job, conv);
}

// Requests from the extension's own windows.
const windowHandlers = {
  // Try again (e.g. after site access was granted). A new need for a decision updates the stored job.
  async retry({ jobId }, format) {
    const job = await loadJob(jobId);
    const result = await runJob({ ...job, format: format || job.format }, { interactive: false });
    if (!result.ok) await chrome.storage.session.set({ [jobKey(jobId)]: { ...job, ...result } });
    return result;
  },

  original({ jobId }) {
    return windowHandlers.retry({ jobId }, "original");
  },

  // The converted file, for writing into the folder from the ask window.
  async blobFor({ jobId }) {
    const job = await loadJob(jobId);
    let res = await toOffscreen({ type: "take", jobId });
    if (!res.ok && res.code === "expired") {
      const conv = await convertJob(job, await getSettings(), "none");
      if (!conv.ok) return conv;
      res = await toOffscreen({ type: "take", jobId });
    }
    return res.ok ? { ok: true, dataUrl: res.dataUrl, target: job.target } : res;
  },

  // More options: the result for the chosen settings, with its real size.
  preview({ jobId, format, options }) {
    return convertForWindow(jobId, format, options);
  },

  // Copy as PNG: the PNG bytes for the window to put on the clipboard.
  copy({ jobId, options }) {
    return convertForWindow(jobId, "png", options);
  },

  // More options → Save: a normal save with the window's choices. Needs for a decision open the ask window.
  async save({ jobId, format, options }) {
    if (!WINDOW_FORMATS.includes(format)) throw new JobError("unknown", `Unknown format ${format}`);
    const job = await loadJob(jobId);
    return runJob({ url: job.url, pageUrl: job.pageUrl, format, options: cleanOptions(options), sourceId: jobId });
  },

  // Copy failed: save the same image as PNG the usual way instead.
  async savePng({ jobId, options }) {
    const job = await loadJob(jobId);
    return runJob({ url: job.url, pageUrl: job.pageUrl, format: "png", options: cleanOptions(options), sourceId: jobId });
  },

  // The window's job, for windows that open before anything was converted.
  async job({ jobId }) {
    const { id, url, pageUrl } = await loadJob(jobId);
    return { ok: true, id, url, pageUrl, settings: await getSettings() };
  },

  // Open the image itself in a new tab (only web addresses).
  async openSource({ jobId }) {
    const job = await loadJob(jobId);
    if (!/^https?:/i.test(job.url)) return { ok: false };
    await chrome.tabs.create({ url: job.url });
    return { ok: true };
  },

  async done({ jobId }) {
    await finishJob(jobId);
    return { ok: true };
  },
};

// Only the extension's own pages may send these, and only about jobs started from the menu:
// a message names a job id, never a URL to fetch.
const fromOwnPage = (sender) => sender.id === chrome.runtime.id && sender.url?.startsWith(chrome.runtime.getURL(""));

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.target !== "background" || !Object.hasOwn(windowHandlers, msg.type) || !fromOwnPage(sender)) return false;
  if (typeof msg.jobId !== "string") return false;
  windowHandlers[msg.type](msg)
    .then(sendResponse)
    .catch((e) => sendResponse({ ok: false, reason: "error", code: e.code || "unknown", detail: e.detail || e.message || "" }));
  return true;
});
