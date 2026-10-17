// Service worker: context menu, save jobs, and the extension's small windows
// (ask: a save needs your OK; copy: Copy as PNG; editor: More options).

import { FORMATS, GIF_LIMITS, getSettings, buildTarget, targetPath, extFromUrl, clampQuality, cleanColour } from "./lib/settings.js";
import { cleanMaxWidth } from "./lib/image.js";
import { JobError } from "./lib/job-error.js";

import { AVIF_DEFAULT_QUALITY } from "./lib/avif.js";
import { ANALYTICS, addCount, conversionKey, dayIsOver, dayOf, failureKey, summaryEvent, summaryProps, sendSummary, COUNT_KEYS } from "./lib/telemetry.js";
import { storeFor } from "./lib/review.js";
import { uninstallUrl } from "./lib/uninstall.js";
import { findImageInPage } from "./lib/find-image.js";
import { DAY, NEW_DAYS, MENU_SINCE, newItemsSince, newUsage, recordUse, markAsked, menuAskVisible, windowCanAsk, markWindowAsked, askExpired, finishAsk, reviewUrl } from "./lib/review.js";

const msg = (key, subs) => chrome.i18n.getMessage(key, subs);

const MENU = {
  "imgkeep-png": "png",
  "imgkeep-jpg": "jpg",
  "imgkeep-webp": "webp",
  "imgkeep-gif": "gif",
  "imgkeep-pdf": "pdf",
  "imgkeep-original": "original",
};

const TITLES = {
  "imgkeep-png": () => "PNG",
  "imgkeep-jpg": () => "JPG",
  "imgkeep-webp": () => "WebP",
  "imgkeep-gif": () => msg("menuGif"),
  "imgkeep-pdf": () => "PDF",
  "imgkeep-original": () => msg("menuOriginal"),
  "imgkeep-copy": () => msg("menuCopyPng"),
  "imgkeep-more": () => msg("menuMoreOptions"),
};

// contextMenus has no getter, so the current titles are kept here (tests read them too).
const menuTitles = new Map();
globalThis.imgkeepMenuTitles = menuTitles;

const contexts = ["image"];
const ignoreError = () => void chrome.runtime.lastError;

// The format of the last save made from the menu, offered again at the top. Short names: "GIF", not "GIF (keeps animation)".
const SHORT = { png: "PNG", jpg: "JPG", webp: "WebP", gif: "GIF", pdf: "PDF", original: () => msg("menuOriginal") };
const lastUsedTitle = (format) => msg("menuLastUsed", [typeof SHORT[format] === "function" ? SHORT[format]() : SHORT[format]]);

async function createMenus() {
  const { lastFormat } = await chrome.storage.local.get("lastFormat");
  return new Promise((resolve) => {
    chrome.contextMenus.removeAll(() => {
      menuTitles.clear();
      chrome.contextMenus.create({ id: "imgkeep", title: msg("menuParent"), contexts });
      const item = (id, type) => {
        chrome.contextMenus.create({ id, parentId: "imgkeep", title: TITLES[id]?.(), type, contexts });
        if (TITLES[id]) menuTitles.set(id, TITLES[id]());
      };
      // Menus keep the order they were created in, so "last used" comes first, in the same spot every time.
      if (SHORT[lastFormat]) {
        chrome.contextMenus.create({ id: "imgkeep-last", parentId: "imgkeep", title: lastUsedTitle(lastFormat), contexts });
        menuTitles.set("imgkeep-last", lastUsedTitle(lastFormat));
        item("imgkeep-sep0", "separator");
      }
      for (const id of ["imgkeep-png", "imgkeep-jpg", "imgkeep-webp", "imgkeep-gif", "imgkeep-pdf"]) item(id);
      item("imgkeep-sep", "separator");
      item("imgkeep-original");
      item("imgkeep-sep2", "separator");
      item("imgkeep-copy");
      item("imgkeep-more");
      createFindMenu();
      resolve();
    });
  });
}

// ---- Usage counts (local only) for the one rating ask ----

async function getUsage() {
  const { usage } = await chrome.storage.local.get("usage");
  return usage || newUsage(Date.now());
}

// One at a time, so saves finishing together don't overwrite each other's counts.
let usageQueue = Promise.resolve();
function countUse(ok) {
  usageQueue = usageQueue.then(async () => {
    await chrome.storage.local.set({ usage: recordUse(await getUsage(), ok) });
    await refreshMenus();
  });
  return usageQueue;
}

// "New" labels for a while after an update, and the "Rate it" item while the one ask is open.
async function refreshMenus() {
  const now = Date.now();
  const { menuNew } = await chrome.storage.local.get("menuNew");
  const fresh = menuNew && now < menuNew.until ? menuNew.items : [];
  if (menuNew && !fresh.length) await chrome.storage.local.remove("menuNew");
  for (const id of Object.keys(MENU_SINCE)) {
    const title = fresh.includes(id) ? msg("menuNew", [TITLES[id]()]) : TITLES[id]();
    if (menuTitles.get(id) === title) continue;
    chrome.contextMenus.update(id, { title }, ignoreError);
    menuTitles.set(id, title);
  }

  let usage = await getUsage();
  if (askExpired(usage, now)) {
    usage = finishAsk(usage); // left unanswered: it was the one ask
    await chrome.storage.local.set({ usage });
  }
  const showRate = menuAskVisible(usage, now);
  if (showRate && usage.ask === "waiting") {
    await chrome.storage.local.set({ usage: markAsked(usage, now) });
    count("rating_asked");
  }
  // Decided from storage every time, not from menuTitles: the worker may have restarted since the menu was built.
  // Creating an item that exists, or removing one that doesn't, is a harmless error.
  if (showRate) {
    chrome.contextMenus.create({ id: "imgkeep-sep3", parentId: "imgkeep", type: "separator", contexts }, ignoreError);
    chrome.contextMenus.create({ id: "imgkeep-rate", parentId: "imgkeep", title: msg("menuRate"), contexts }, ignoreError);
    menuTitles.set("imgkeep-rate", msg("menuRate"));
  } else {
    chrome.contextMenus.remove("imgkeep-rate", ignoreError);
    chrome.contextMenus.remove("imgkeep-sep3", ignoreError);
    menuTitles.delete("imgkeep-rate");
  }
}

async function onInstalled({ reason, previousVersion }) {
  await createMenus();
  const now = Date.now();
  const { usage } = await chrome.storage.local.get("usage");
  // Existing users start their 7 days from the update that added the ask.
  if (!usage) await chrome.storage.local.set({ usage: newUsage(now) });
  if (reason === "update" && previousVersion) {
    const items = newItemsSince(previousVersion);
    if (items.length) await chrome.storage.local.set({ menuNew: { items, until: now + NEW_DAYS * DAY } });
  }
  await refreshMenus();
}

chrome.runtime.onInstalled.addListener((details) => onInstalled(details).then(() => checkCounts()));

// After an uninstall the browser opens the short, optional uninstall form (lib/uninstall.js). Set on every
// start, so it always carries the current version. Needs no permission.
const uninstallPage = uninstallUrl(chrome.runtime.getManifest().version);
chrome.runtime.setUninstallURL(uninstallPage).then(
  () => (globalThis.imgkeepUninstallUrl = uninstallPage), // for automated tests only
  () => {},
);
// Menus survive restarts, but this module's record of their titles doesn't: rebuild both.
chrome.runtime.onStartup.addListener(() => createMenus().then(refreshMenus).then(() => checkCounts()));

// For automated tests only.
globalThis.imgkeepOnInstalled = onInstalled;
globalThis.imgkeepRefreshMenus = refreshMenus;
globalThis.imgkeepOpenRateWindow = () => openRateWindow();

function openRateWindow() {
  return chrome.windows.create({ url: chrome.runtime.getURL("rate.html"), type: "popup", width: 440, height: 240, focused: true });
}

// Remembers the format of a save made from the menu, and puts it at the top of the menu.
async function rememberFormat(format) {
  const { lastFormat } = await chrome.storage.local.get("lastFormat");
  if (lastFormat === format) return;
  await chrome.storage.local.set({ lastFormat: format });
  if (menuTitles.has("imgkeep-last")) {
    chrome.contextMenus.update("imgkeep-last", { title: lastUsedTitle(format) }, ignoreError);
    menuTitles.set("imgkeep-last", lastUsedTitle(format));
  } else {
    // The first time (or after the worker restarted): rebuild, since new items can only go at the end.
    await createMenus();
    await refreshMenus();
  }
}

// ---- Find image here (opt-in) ----
// Some sites cover their images with another layer, so the browser's "image" right-click never fires and
// Imgkeep's menu doesn't appear. On those sites only, "Find image here" looks at that one page, once, when
// the user clicks it (activeTab + scripting, both optional and off until turned on). It never changes a page.

const FIND_PERMISSIONS = { permissions: ["activeTab", "scripting"] };

const COVERED_SITES = [
  "*://*.instagram.com/*",
  "*://*.threads.com/*",
  "*://*.threads.net/*",
  "*://*.facebook.com/*",
  "*://x.com/*",
  "*://*.x.com/*",
  "*://twitter.com/*",
  "*://*.twitter.com/*",
  "*://*.tumblr.com/*",
  "*://*.flickr.com/*",
  ...["com", "co.uk", "ca", "de", "fr", "es", "it", "com.au", "jp", "com.mx", "pt", "at", "ch", "nz", "ie", "ph", "cl", "dk", "se", "co.kr"].map((tld) => `*://*.pinterest.${tld}/*`),
];

function createFindMenu() {
  chrome.contextMenus.create(
    { id: "imgkeep-find", title: msg("menuFindImage"), contexts: ["page", "link", "frame"], documentUrlPatterns: COVERED_SITES },
    ignoreError,
  );
}

const findTurnedOn = () => chrome.permissions.contains(FIND_PERMISSIONS);

// Runs the finder in the page the user asked about. Only image addresses come back.
async function findImage(info, tab) {
  const pageUrl = info.pageUrl || tab?.url || "";
  if (!(await findTurnedOn())) return openWindow("find", { mode: "enable", pageUrl });
  let result;
  try {
    [{ result } = {}] = await chrome.scripting.executeScript({
      target: { tabId: tab.id, frameIds: [info.frameId || 0] },
      func: findImageInPage,
      args: [typeof info.linkUrl === "string" ? info.linkUrl : null],
    });
  } catch {
    // Turned on after this page's right-click, or a page Chrome doesn't let extensions look at.
    return openWindow("find", { mode: "error", pageUrl });
  }
  globalThis.imgkeepLastFind = result; // for automated tests only
  const isWeb = (u) => typeof u === "string" && /^(https?:|data:image\/)/i.test(u);
  const onScreen = (result?.onScreen || []).filter((c) => isWeb(c.url)).slice(0, 12);
  if (isWeb(result?.found?.url)) {
    count("find_found");
    return openWindow("editor", { url: result.found.url, pageUrl });
  }
  if (onScreen.length) {
    count("find_picker");
    return openWindow("find", { mode: "pick", pageUrl, candidates: onScreen });
  }
  count("find_nothing");
  return openWindow("find", { mode: "nothing", pageUrl });
}

// For automated tests only: run the finder on a tab, as if "Find image here" was clicked there.
globalThis.imgkeepFindImage = (tabId, url) => findImage({ pageUrl: url, frameId: 0 }, { id: tabId, url });

async function menuClicked(info, tab) {
  if (info.menuItemId === "imgkeep-find") return findImage(info, tab);
  if (info.menuItemId === "imgkeep-rate") return openRateWindow();
  if (!info.srcUrl) return;
  const input = { url: info.srcUrl, pageUrl: info.pageUrl };
  if (info.menuItemId === "imgkeep-copy") return openWindow("copy", input);
  if (info.menuItemId === "imgkeep-more") return openWindow("editor", input);
  let format = MENU[info.menuItemId];
  if (info.menuItemId === "imgkeep-last") {
    ({ lastFormat: format } = await chrome.storage.local.get("lastFormat"));
    count("last_used");
  }
  if (!MENU_FORMATS.includes(format)) return;
  rememberFormat(format).catch(() => {});
  return runJob({ ...input, format });
}

const MENU_FORMATS = Object.values(MENU);
chrome.contextMenus.onClicked.addListener((info, tab) => void menuClicked(info, tab));

// For automated tests only.
globalThis.imgkeepMenuClicked = menuClicked;

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
  const quality = job.format === "webp" ? settings.webpQuality : job.format === "avif" ? AVIF_DEFAULT_QUALITY : settings.jpgQuality; // PDF photos use JPG quality
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
  const size = {
    width: conv.width,
    height: conv.height,
    mime: conv.mime,
    bytes: conv.size,
    resized: conv.width < conv.sourceWidth,
    sourceType: conv.sourceType,
  };

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
    origin: input.origin, // "editor" for saves from More options (only for counting)
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
  // Successes and real failures count towards the rating ask (site access and folder questions don't).
  if (result.ok || result.reason === "error") await countUse(result.ok).catch(() => {});
  await countJob(job, result); // counted before the result is returned, so the order is always the same
  if (!result.ok && interactive) await openAsk({ ...job, ...result });
  return result;
}

// For automated tests only.
globalThis.imgkeepRunJob = runJob;

// ---- Anonymous daily counts (lib/telemetry.js; on by default, off in Options) ----

let appKey = ANALYTICS.appKey;
let countsQueue = Promise.resolve();
let sendQueue = Promise.resolve();

const countsOn = async () => (await getSettings()).usageCounts !== false;

// Adds to today's counts. When a new day starts, yesterday's counts become one summary to send.
function count(...keys) {
  countsQueue = countsQueue
    .then(async () => {
      if (!(await countsOn())) return;
      const today = dayOf();
      let { counts } = await chrome.storage.local.get("counts");
      if (dayIsOver(counts, today)) {
        await chrome.storage.local.set({ countsOutbox: { day: counts.day, props: summaryProps(counts.c, storeFor(navigator.userAgent)) } });
        counts = null;
      }
      for (const key of keys) counts = addCount(counts, key, today);
      // Yesterday's counts must go once they're the summary: a wake-up that counts nothing used to leave
      // them in place, so every later wake-up sent the same summary again (fixed in 0.10.1).
      if (counts) await chrome.storage.local.set({ counts });
      else await chrome.storage.local.remove("counts");
      // Sending happens on its own queue: a save waits for its count to be stored, never for the network.
      sendQueue = sendQueue.then(sendOutbox).catch(() => {});
    })
    .catch(() => {});
  return countsQueue;
}

// Sends the waiting summary, if any. Kept for another try if it fails (offline); dropped after 7 days.
async function sendOutbox() {
  const { countsOutbox: box } = await chrome.storage.local.get("countsOutbox");
  if (!box) return;
  const event = summaryEvent(box.props, {
    appVersion: chrome.runtime.getManifest().version,
    locale: chrome.i18n.getUILanguage(),
    // Store installs have an update_url; an unpacked copy (development, testing) doesn't, and its
    // summaries are marked debug so they stay out of the real numbers.
    isDebug: !("update_url" in chrome.runtime.getManifest()),
  });
  if (await sendSummary(event, appKey)) {
    await chrome.storage.local.set({ countsLastSent: { day: box.day, props: box.props, sentAt: Date.now() } });
    await chrome.storage.local.remove("countsOutbox");
  } else if (Date.now() - new Date(`${box.day}T12:00:00`).getTime() > 7 * DAY) {
    await chrome.storage.local.remove("countsOutbox");
  }
}

// A day may have ended while the browser was closed: check when Imgkeep starts.
const checkCounts = () => count();

function countJob(job, result) {
  if (result.ok) {
    const keys = [`save_${job.format}`, `mode_${result.mode}`];
    if (result.resized) keys.push("resized");
    const conversion = conversionKey(result.sourceType, job.format);
    if (conversion) keys.push(conversion);
    if (job.origin === "editor") keys.push("more_options_save");
    return count(...keys);
  }
  if (result.reason === "host") return count("site_access_asked");
  if (result.reason === "no-folder" || result.reason === "folder-permission") return count("folder_asked");
  return count(failureKey(result.code));
}

// Turning counts off drops whatever was counted and not yet sent.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.usageCounts?.newValue === false) chrome.storage.local.remove(["counts", "countsOutbox"]);
});

// For automated tests only.
globalThis.imgkeepCount = async (...keys) => {
  await count(...keys);
  await sendQueue;
};
globalThis.imgkeepSetAppKey = (key) => (appKey = key);

// ---- Windows ----

const jobKey = (id) => `job:${id}`;

const WINDOWS = {
  ask: { width: 480, height: 380 },
  copy: { width: 400, height: 220 },
  editor: { width: 600, height: 780 },
  find: { width: 560, height: 560 },
};

async function openWindow(page, input) {
  const job = { id: crypto.randomUUID(), pageUrl: "", ...input };
  if (page === "editor") count("more_options");
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

const WINDOW_FORMATS = ["png", "jpg", "webp", "avif", "ico", "bmp"];

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
    return runJob({ url: job.url, pageUrl: job.pageUrl, format, options: cleanOptions(options), sourceId: jobId, origin: "editor" });
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

  // Find image: what this window is for (turn on, pick, nothing found, or couldn't look).
  async finderJob({ jobId }) {
    const { mode, candidates = [], pageUrl } = await loadJob(jobId);
    return { ok: true, mode, pageUrl, candidates: candidates.map(({ url, width, height }) => ({ url, width, height })) };
  },

  // Find image: the user picked one of the images found on screen. Only an index comes from the window;
  // the address is the one the finder stored.
  async pickImage({ jobId, index }) {
    const job = await loadJob(jobId);
    const pick = job.candidates?.[Number(index)];
    if (!pick) return { ok: false, code: "expired" };
    await openWindow("editor", { url: pick.url, pageUrl: job.pageUrl });
    return { ok: true };
  },

  // Find image: turned on from its window (the window asked the browser, which needs the click).
  async finderTurnedOn() {
    if (await findTurnedOn()) count("find_enabled");
    return { ok: true, on: await findTurnedOn() };
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

// The rating ask, from any of the extension's windows (no job needed).
const reviewHandlers = {
  // Show the ask in this window? Only once, the first time it's ready.
  async shouldAskRating() {
    await usageQueue; // a use counted just now may be what makes it due
    const usage = await getUsage();
    if (!windowCanAsk(usage, Date.now())) return { ok: true, show: false };
    if (usage.ask === "waiting") count("rating_asked");
    await chrome.storage.local.set({ usage: markWindowAsked(usage, Date.now()) });
    await refreshMenus();
    return { ok: true, show: true };
  },

  // "rate" opens the store's review page for this browser; "no" just closes the ask. Either way it's done.
  async review({ action }) {
    await chrome.storage.local.set({ usage: finishAsk(await getUsage()) });
    await refreshMenus();
    count(action === "rate" ? "rating_rate" : "rating_no");
    if (action === "rate") await chrome.tabs.create({ url: reviewUrl(navigator.userAgent) });
    return { ok: true };
  },

  // Counts only the windows know about: a site allowed from a window, a copy the clipboard refused.
  async count({ key }) {
    if (["site_access_allowed", "fail_copy"].includes(key)) count(key);
    return { ok: true };
  },

  // A copy reached the clipboard (copies happen in the windows, not here).
  async copied() {
    count("copy");
    await countUse(true);
    return { ok: true };
  },
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.target !== "background" || !fromOwnPage(sender)) return false;
  const handler = Object.hasOwn(reviewHandlers, msg.type)
    ? reviewHandlers[msg.type]
    : Object.hasOwn(windowHandlers, msg.type) && typeof msg.jobId === "string"
      ? windowHandlers[msg.type]
      : null;
  if (!handler) return false;
  handler(msg)
    .then(sendResponse)
    .catch((e) => sendResponse({ ok: false, reason: "error", code: e.code || "unknown", detail: e.detail || e.message || "" }));
  return true;
});
