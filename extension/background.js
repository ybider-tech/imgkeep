// Service worker: context menu, save jobs, and the small ask window.

import { FORMATS, GIF_LIMITS, getSettings, buildTarget, targetPath, extFromUrl } from "./lib/settings.js";
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
    chrome.contextMenus.create({ id: "imgkeep", title: msg("menuParent"), contexts });
    chrome.contextMenus.create({ id: "imgkeep-png", parentId: "imgkeep", title: "PNG", contexts });
    chrome.contextMenus.create({ id: "imgkeep-jpg", parentId: "imgkeep", title: "JPG", contexts });
    chrome.contextMenus.create({ id: "imgkeep-webp", parentId: "imgkeep", title: "WebP", contexts });
    chrome.contextMenus.create({ id: "imgkeep-gif", parentId: "imgkeep", title: msg("menuGif"), contexts });
    chrome.contextMenus.create({ id: "imgkeep-pdf", parentId: "imgkeep", title: "PDF", contexts });
    chrome.contextMenus.create({ id: "imgkeep-sep", parentId: "imgkeep", type: "separator", contexts });
    chrome.contextMenus.create({ id: "imgkeep-original", parentId: "imgkeep", title: msg("menuOriginal"), contexts });
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  const format = MENU[info.menuItemId];
  if (format && info.srcUrl) runJob({ url: info.srcUrl, format, pageUrl: info.pageUrl });
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

// Drop a converted file without starting the offscreen document just for that.
async function releaseIfOpen(jobId) {
  const url = chrome.runtime.getURL("offscreen.html");
  const open = await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"], documentUrls: [url] });
  if (open.length) await chrome.runtime.sendMessage({ target: "offscreen", type: "release", jobId });
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

function convertJob(job, settings, want) {
  const fmt = FORMATS[job.format];
  return toOffscreen({
    type: "convert",
    jobId: job.id,
    url: job.url,
    mime: fmt.mime,
    quality: job.format === "webp" ? settings.webpQuality : settings.jpgQuality, // PDF photos use JPG quality
    background: settings.jpgBackground,
    want,
  });
}

// "Original format" always goes through chrome.downloads, untouched.
async function saveOriginal(job, settings) {
  if (job.url.startsWith("blob:")) return { ok: false, reason: "error", code: "blob" };
  const ext = extFromUrl(job.url);
  // Unknown type: let Chrome name the file from the server's answer.
  const filename = ext ? targetPath(buildTarget({ settings, url: job.url, ext })) : "";
  const downloadId = await download({ url: job.url, filename, saveAs: settings.saveMode === "ask" });
  return { ok: true, mode: "downloads", downloadId, filename };
}

async function attempt(job) {
  const settings = await getSettings();
  if (job.format === "original") return saveOriginal(job, settings);
  const fmt = FORMATS[job.format];
  if (!fmt) throw new JobError("unknown", `Unknown format ${job.format}`);
  if (job.url.startsWith("blob:")) return { ok: false, reason: "error", code: "blob" };

  const mode = settings.saveMode;
  const conv = await convertJob(job, settings, mode === "folder" ? "none" : "url");
  if (!conv.ok) {
    if (conv.code === "blocked" && /^https?:/.test(job.url)) {
      const origin = originPattern(job.url);
      const allowed = await chrome.permissions.contains({ origins: [origin] });
      if (!allowed) return { ok: false, reason: "host", origin, host: new URL(job.url).hostname };
    }
    return { ok: false, reason: "error", code: conv.code, detail: conv.detail, detailSubs: conv.subs };
  }

  const target = buildTarget({ settings, url: job.url, width: conv.width, height: conv.height, ext: fmt.ext });
  const size = { width: conv.width, height: conv.height };

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
  else toOffscreen({ type: "release", jobId: job.id });
  return { ok: true, mode, downloadId, filename, ...size };
}

// Runs one save. If it needs the user's decision, opens the ask window (unless interactive is false).
async function runJob(input, { interactive = true } = {}) {
  const job = { id: input.id || crypto.randomUUID(), url: input.url, format: input.format, pageUrl: input.pageUrl || "" };
  let result;
  try {
    result = await attempt(job);
  } catch (e) {
    result = { ok: false, reason: "error", code: e.code || "unknown", detail: e.detail || e.message || "" };
  }
  result.jobId = job.id;
  if (!result.ok && interactive) await openAsk({ ...job, ...result });
  return result;
}

// For automated tests only.
globalThis.imgkeepRunJob = runJob;

// ---- Ask window ----

const jobKey = (id) => `job:${id}`;

async function openAsk(job) {
  await chrome.storage.session.set({ [jobKey(job.id)]: job });
  await chrome.windows.create({
    url: chrome.runtime.getURL(`ask.html?job=${encodeURIComponent(job.id)}`),
    type: "popup",
    width: 460,
    height: 360,
    focused: true,
  });
}

async function loadJob(jobId) {
  const key = jobKey(jobId);
  const stored = await chrome.storage.session.get(key);
  if (!stored[key]) throw new JobError("expired");
  return stored[key];
}

async function finishJob(jobId) {
  await chrome.storage.session.remove(jobKey(jobId));
  await releaseIfOpen(jobId);
}

// Requests from ask.html.
const askHandlers = {
  // Try again (e.g. after site access was granted). A new need for a decision updates the stored job.
  async retry({ jobId }, format) {
    const job = await loadJob(jobId);
    const result = await runJob({ ...job, format: format || job.format }, { interactive: false });
    if (!result.ok) await chrome.storage.session.set({ [jobKey(jobId)]: { ...job, ...result } });
    return result;
  },

  original({ jobId }) {
    return askHandlers.retry({ jobId }, "original");
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

  async done({ jobId }) {
    await finishJob(jobId);
    return { ok: true };
  },
};

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.target !== "background" || !askHandlers[msg.type]) return false;
  askHandlers[msg.type](msg)
    .then(sendResponse)
    .catch((e) => sendResponse({ ok: false, reason: "error", code: e.code || "unknown", detail: e.detail || e.message || "" }));
  return true;
});
