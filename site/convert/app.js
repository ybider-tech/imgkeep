// Free Image Converter on imgkeep.app: converts images in this page, on this device. Nothing is uploaded:
// the files are read here, converted with the same code as the Imgkeep extension (./lib, a checked copy of
// extension/lib), and handed back as downloads or a PNG on the clipboard. The only requests are this page's
// own files (and the AVIF encoder, from this site, only when AVIF is chosen).
//
// Layout "Format First" (design handoff 2026-10-17): 01 choose the output, 02 add images; results follow.
// Changing the format or a setting converts the images again; a result is only ever shown under the
// settings it was made with (each file's conversions are versioned, late results are dropped).
import { convert } from "./lib/convert.js";
import { DEFAULTS, FORMATS } from "./lib/settings.js";
import { cleanMaxWidth } from "./lib/image.js";

// The page's language: translated pages (imgkeep.app/<lang>/convert/) carry their strings in
// <script type="application/json" id="strings">, keyed by the English text; English needs none.
// {name}-style placeholders are filled in here. scripts/translate-site.mjs finds every t("…") below.
const STRINGS = JSON.parse(document.getElementById("strings")?.textContent || "{}");
const t = (english, vars = {}) => (STRINGS[english] ?? english).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

const MAX_FILES = 20;
const MAX_BYTES = 50 * 1000 * 1000; // 50 MB, decimal, as the page says
const AVIF_QUALITY = 60;
const LOSSY = new Set(["jpg", "webp", "avif"]);
const BACKGROUND = new Set(["jpg", "bmp"]);
const HELPER = {
  png: t("PNG keeps transparency."),
  jpg: t("JPG works well for photos. Transparent areas use your background colour."),
  webp: t("WebP makes compact web images and can keep transparency."),
  avif: t("AVIF makes very small files for the web and keeps transparency. Some older apps can't open it."),
  gif: t("For animations: animated WebP, AVIF and APNG keep moving in Chrome and Edge. GIFs are at most 800 px wide."),
  pdf: t("Creates a one-page PDF for each image."),
  ico: t("Creates one icon file with 16, 32 and 48 px, plus 256 px when the image is at least that big."),
  bmp: t("For software that needs BMP. Transparent areas use your background colour."),
};

const $ = (id) => document.getElementById(id);
const root = $("converter");
const items = []; // { id, file, name, row, out, url, version, status, counted }
let format = "png";
let nextId = 1;
const supported = { webp: true };

const baseName = (name) => (name.replace(/\.[^.]+$/, "") || "image").replace(/[\\/:*?"<>|]+/g, "-").slice(0, 120);
const size = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);
const short = (mime) =>
  ({ "image/jpeg": "jpg", "image/svg+xml": "svg", "image/x-icon": "ico", "image/vnd.microsoft.icon": "ico" })[mime] ||
  (mime.split("/")[1] || "other").replace(/[^a-z0-9]/g, "");
const label = (key) => FORMATS[key]?.label || key.toUpperCase();
const el = (tag, props = {}, ...kids) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...kids.filter((k) => k != null));
  return node;
};
const say = (text) => ($("status").textContent = text); // the polite live region

// Some browsers can't make WebP from a canvas (Safari): offer only what really comes out.
async function canMake(mime) {
  const c = document.createElement("canvas");
  c.width = c.height = 1;
  const blob = await new Promise((r) => c.toBlob(r, mime));
  return blob?.type === mime;
}

let avif = null;
function avifEncoder() {
  avif ??= (async () => {
    const wasmBinary = await (await fetch(new URL("./vendor/avif/avif_enc.wasm", import.meta.url))).arrayBuffer();
    const { default: factory } = await import("./vendor/avif/avif_enc.js");
    return factory({ wasmBinary, noInitialRun: true });
  })().catch((e) => {
    avif = null;
    throw e;
  });
  return avif;
}

if (root) init();

async function init() {
  supported.webp = await canMake("image/webp");
  if (!supported.webp) {
    const b = root.querySelector('[data-format="webp"]');
    b.disabled = true;
    b.querySelector(".cv-fmt-cap").textContent = t("Not in this browser");
    b.title = t("This browser can't create WebP files");
  }
  const preset = root.dataset.to;
  format = FORMATS[preset] && (preset !== "webp" || supported.webp) ? preset : "png";

  for (const b of root.querySelectorAll("[data-format]")) b.addEventListener("click", () => choose(b.dataset.format));
  const more = $("moreBtn");
  const menu = $("moreMenu");
  const closeMenu = (focusBack) => {
    menu.hidden = true;
    more.setAttribute("aria-expanded", "false");
    if (focusBack) more.focus();
  };
  more.addEventListener("click", () => {
    const open = menu.hidden;
    menu.hidden = !open;
    more.setAttribute("aria-expanded", String(open));
    if (open) (menu.querySelector('[aria-pressed="true"]') || menu.querySelector("button")).focus();
  });
  menu.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu(true);
  });
  menu.addEventListener("click", (e) => e.target.closest("[data-format]") && closeMenu(true));
  document.addEventListener("click", (e) => !menu.hidden && !e.target.closest(".cv-more") && closeMenu(false));

  $("advToggle").addEventListener("click", () => {
    const open = $("advanced").hidden;
    $("advanced").hidden = !open;
    $("advToggle").setAttribute("aria-expanded", String(open));
  });
  $("quality").addEventListener("input", () => {
    $("quality").dataset.touched = "1";
    $("qualityOut").textContent = $("quality").value;
    settingsChanged();
  });
  $("maxWidth").addEventListener("input", () => settingsChanged());
  $("background").addEventListener("input", () => {
    $("backgroundHex").value = $("background").value.toUpperCase();
    validateBackground();
    settingsChanged();
  });
  $("backgroundHex").addEventListener("input", () => {
    if (validateBackground()) $("background").value = normalHex($("backgroundHex").value);
    settingsChanged();
  });
  $("background").value = DEFAULTS.jpgBackground;
  $("backgroundHex").value = DEFAULTS.jpgBackground.toUpperCase();

  $("choose").addEventListener("click", () => $("files").click());
  $("files").addEventListener("change", (e) => {
    add([...e.target.files]);
    e.target.value = "";
  });
  const drop = $("drop");
  drop.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (drop.classList.contains("over")) return;
    drop.classList.add("over");
    $("dropTitle").textContent = t("Drop to add images");
  });
  const leave = () => {
    drop.classList.remove("over");
    syncDropTitle();
  };
  drop.addEventListener("dragleave", (e) => !drop.contains(e.relatedTarget) && leave());
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    leave();
    add([...e.dataTransfer.files]);
  });
  // Paste anywhere on the page, except while typing in a field.
  document.addEventListener("paste", (e) => {
    if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;
    const files = [...(e.clipboardData?.files || [])];
    if (files.length) {
      e.preventDefault();
      add(files);
    }
  });
  $("downloadAll").addEventListener("click", () => {
    for (const it of items) if (it.status === "ready") it.row.querySelector("a[download]").click();
    say(t("Downloads started"));
  });
  if (matchMedia("(pointer: coarse)").matches) root.classList.add("touch");
  choose(format, { quiet: true });
  root.dataset.ready = "1";
}

function choose(key, { quiet = false } = {}) {
  if (!FORMATS[key] || (key === "webp" && !supported.webp)) return;
  const changed = key !== format;
  format = key;
  for (const b of root.querySelectorAll("[data-format]")) b.setAttribute("aria-pressed", String(b.dataset.format === key));
  const extra = !["png", "jpg", "webp"].includes(key);
  $("moreBtn").classList.toggle("selected", extra);
  $("moreName").textContent = extra ? label(key) : t("More formats");
  $("moreCap").textContent = extra ? t("Other formats") : $("moreCap").dataset.all;
  $("formatHelper").textContent = HELPER[key];
  $("currentFormat").textContent = label(key);
  $("qualityField").hidden = !LOSSY.has(key);
  $("backgroundField").hidden = !BACKGROUND.has(key);
  $("widthField").hidden = key === "ico"; // an icon has fixed sizes
  if (!$("quality").dataset.touched) $("quality").value = key === "webp" ? DEFAULTS.webpQuality : key === "avif" ? AVIF_QUALITY : DEFAULTS.jpgQuality;
  $("qualityOut").textContent = $("quality").value;
  syncDropTitle();
  if (changed && !quiet) {
    say(t("Output: {format}", { format: label(key) }));
    settingsChanged(true);
  }
}

function syncDropTitle() {
  if ($("drop").classList.contains("over")) return;
  const sentence = items.length ? t("Add more images to convert to {format}") : root.classList.contains("touch") ? t("Add images to convert to {format}") : t("Drop images to convert to {format}");
  const [before, after = ""] = sentence.split("{format}");
  $("dropTitle").replaceChildren(before, el("span", { className: "cv-target", textContent: label(format) }), after);
  $("choose").textContent = items.length ? t("Add more images") : t("Choose images");
  $("drop").classList.toggle("compact", items.length > 0);
}

const normalHex = (v) => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(v).trim());
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return `#${h.toLowerCase()}`;
};
function validateBackground() {
  const ok = Boolean(normalHex($("backgroundHex").value));
  $("bgError").hidden = ok;
  $("backgroundHex").setAttribute("aria-invalid", String(!ok));
  return ok;
}
function validWidth() {
  const raw = $("maxWidth").value.trim();
  const ok = raw === "" || (/^\d+$/.test(raw) && Number(raw) > 0);
  $("widthError").hidden = ok;
  $("maxWidth").setAttribute("aria-invalid", String(!ok));
  return ok;
}
const settingsValid = () => validWidth() && (!BACKGROUND.has(format) || validateBackground());

function options() {
  return {
    mime: FORMATS[format].mime,
    quality: Number($("quality").value),
    background: normalHex($("backgroundHex").value) || DEFAULTS.jpgBackground,
    maxWidth: format === "ico" ? 0 : cleanMaxWidth($("maxWidth").value),
    avifEncoder,
  };
}

// A settings change converts every image again (debounced while a slider moves). Invalid settings
// convert nothing and leave the current results as they are.
let timer = null;
function settingsChanged(now = false) {
  clearTimeout(timer);
  if (!settingsValid()) return;
  if (!items.some((it) => it.file)) return;
  const go = () => {
    for (const it of items) if (it.file) schedule(it);
    say(t("Updating results to {format}…", { format: label(format) }));
  };
  if (now) go();
  else timer = setTimeout(go, 300);
}

function add(files) {
  const room = MAX_FILES - items.filter((it) => it.file).length;
  let accepted = 0;
  for (const file of files) {
    const name = file.name || t("Pasted image");
    let problem = null;
    if (/\.(heic|heif)$/i.test(name) || /hei[cf]/i.test(file.type)) problem = t("{name} isn't supported in this browser: HEIC photos can't be opened in Chrome, Edge or Firefox.", { name });
    else if (file.type && !file.type.startsWith("image/")) problem = t("{name} isn't an image this converter can open.", { name });
    else if (file.size > MAX_BYTES) problem = t("{name} exceeds the 50 MB limit.", { name });
    else if (accepted >= room) problem = t("You can add up to {max} files. Remove an image to add {name}.", { max: MAX_FILES, name });
    if (problem) {
      rejected(name, problem);
      continue;
    }
    accepted++;
    const it = { id: nextId++, file, name, version: 0, status: "queued", counted: new Set() };
    it.row = row(it);
    items.push(it);
    $("results").append(it.row);
    if (settingsValid()) schedule(it);
    else setState(it, t("Waiting: fix the setting above"));
  }
  refresh();
}

function rejected(name, text) {
  const it = { id: nextId++, name, status: "rejected" };
  it.row = el(
    "li",
    { className: "cv-row failed" },
    el("div", { className: "cv-thumb fallback", textContent: "!" }),
    el("div", { className: "cv-info" }, el("p", { className: "cv-name", textContent: t("Couldn't add {name}", { name }) }), el("p", { className: "cv-error", textContent: text })),
    el("div", { className: "cv-actions" }, removeButton(it)),
  );
  items.push(it);
  $("results").append(it.row);
}

function row(it) {
  return el(
    "li",
    { className: "cv-row" },
    el("div", { className: "cv-thumb fallback", textContent: short(it.file.type || "") || "img" }),
    el(
      "div",
      { className: "cv-info" },
      el("p", { className: "cv-name", textContent: `${baseName(it.name)}.${FORMATS[format].ext}` }),
      el("p", { className: "cv-from", textContent: t("From {name}", { name: it.name }) }),
      el("p", { className: "cv-meta" }),
      el("p", { className: "cv-state", textContent: t("Queued") }),
    ),
    el("div", { className: "cv-actions" }, removeButton(it)),
  );
}

function removeButton(it) {
  const b = el("button", { type: "button", className: "cv-remove", title: t("Remove") });
  b.setAttribute("aria-label", t("Remove {name}", { name: it.name }));
  b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  b.addEventListener("click", () => remove(it));
  return b;
}

function remove(it) {
  it.removed = true;
  if (it.url) URL.revokeObjectURL(it.url);
  it.row.remove();
  items.splice(items.indexOf(it), 1);
  say(t("Removed {name}", { name: it.name }));
  refresh();
  if (!items.length) $("choose").focus();
}

// One conversion at a time, so big batches don't freeze the tab.
let queue = Promise.resolve();
function schedule(it) {
  const version = ++it.version;
  const opts = options();
  const key = format;
  it.status = it.out ? "updating" : "queued";
  setState(it, it.out ? t("Updating results…") : t("Queued"));
  it.row.querySelectorAll(".cv-download, .cv-copy").forEach((b) => b.remove()); // never an old file under a new label
  queue = queue.then(() => run(it, version, key, opts)).catch(() => {});
}

async function run(it, version, key, opts) {
  if (it.removed || version !== it.version) return; // a newer setting or a removal won
  setState(it, t("Converting…"));
  try {
    const out = await convert(it.file, { ...opts, title: baseName(it.name) });
    if (it.removed || version !== it.version) return; // stale: never shown under the new settings
    if (it.url) URL.revokeObjectURL(it.url);
    it.out = out;
    it.url = URL.createObjectURL(out.blob);
    it.status = "ready";
    showReady(it, key, opts);
    const pair = `${short(out.sourceType || it.file.type || "")}>${key}`;
    if (!it.counted.has(pair)) {
      it.counted.add(pair);
      counts.set(pair, (counts.get(pair) || 0) + 1);
    }
  } catch (e) {
    if (it.removed || version !== it.version) return;
    it.status = "failed";
    showFailed(it, e);
  }
  refresh();
  flushCounts();
}

function setState(it, text) {
  const s = it.row.querySelector(".cv-state");
  s.className = "cv-state";
  s.textContent = text;
  it.row.classList.toggle("busy", /…$/.test(text));
}

function showReady(it, key, opts) {
  const { out } = it;
  const name = `${baseName(it.name)}.${out.ext}`;
  it.row.classList.remove("failed");
  const thumb = out.ext === "pdf" ? el("div", { className: "cv-thumb fallback", textContent: "PDF" }) : el("img", { className: "cv-thumb", src: it.url, alt: "" });
  it.row.querySelector(".cv-thumb").replaceWith(thumb);
  it.row.querySelector(".cv-name").textContent = name;
  it.row.querySelector(".cv-meta").textContent = `${out.width} × ${out.height} · ${label(key)} · ${size(out.blob.size)} (original ${size(it.file.size)})`;
  setState(it, `✓ ${t("Ready")}`);
  const download = el("a", { className: "cv-download", href: it.url, download: name, textContent: t("Download {format}", { format: label(key) }) });
  download.addEventListener("click", () => say(t("Download started: {name}", { name })));
  const kids = [download];
  if (canCopy) kids.push(copyButton(it, opts));
  it.row.querySelector(".cv-actions").prepend(...kids);
}

function showFailed(it, e) {
  it.row.classList.add("failed");
  it.row.querySelectorAll(".cv-download, .cv-copy").forEach((b) => b.remove());
  const why = {
    decode: t("It may be damaged, or a format this browser can't open."),
    unsupported: t("This browser can't make that format."),
    "too-large": t("It's too large to convert here."),
    timeout: t("It took too long and was stopped."),
  }[e?.code];
  setState(it, `${t("We couldn't convert {name}. Try another image or format.", { name: it.name })}${why ? ` ${why}` : ""}`);
  it.row.querySelector(".cv-state").className = "cv-state cv-error";
}

// Copy as PNG: a real PNG on the clipboard, transparency kept, whatever was chosen for the download (web
// pages can only put PNG images on the clipboard).
const canCopy = Boolean(navigator.clipboard?.write && window.ClipboardItem);
function copyButton(it, opts) {
  const b = el("button", { type: "button", className: "cv-copy", textContent: t("Copy as PNG") });
  b.addEventListener("click", async () => {
    const png = it.out.blob.type === "image/png" ? Promise.resolve(it.out.blob) : convert(it.file, { ...opts, mime: "image/png", title: undefined }).then((r) => r.blob);
    try {
      // Handed over as a promise so the copy stays tied to this click while the PNG is made.
      await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
      b.textContent = t("Copied as PNG");
      say(t("Copied {name} as PNG", { name: it.name }));
      window.imgkeepCountConversion?.(short(it.out.sourceType || it.file.type || ""), "clipboard", 1);
    } catch {
      b.textContent = t("Couldn't copy: download it instead");
    }
    setTimeout(() => (b.textContent = t("Copy as PNG")), 2500);
  });
  return b;
}

const isBusy = (it) => it.status === "queued" || it.status === "updating" || it.row?.classList.contains("busy");
function refresh() {
  const ready = items.filter((it) => it.status === "ready").length;
  const failed = items.filter((it) => it.status === "failed").length;
  const notAdded = items.filter((it) => it.status === "rejected").length;
  const busy = items.filter(isBusy).length;
  $("resultsArea").hidden = items.length === 0;
  const parts = [];
  if (ready) parts.push(t("{n} ready", { n: ready }));
  if (busy) parts.push(t("{n} converting", { n: busy }));
  if (failed) parts.push(t("{n} couldn't be converted", { n: failed }));
  if (notAdded) parts.push(notAdded === 1 ? t("{n} file not added", { n: notAdded }) : t("{n} files not added", { n: notAdded }));
  $("summary").textContent = parts.join(" · ");
  $("downloadAll").hidden = ready < 2;
  if (ready) $("install").hidden = false;
  syncDropTitle();
  if (!busy && items.length) say(`${parts.join(", ")}. Nothing was uploaded.`);
}

// Anonymous counts (count.js, imgkeep.app only): the format pair and how many files, nothing else.
const counts = new Map();
function flushCounts() {
  if (items.some(isBusy)) return;
  for (const [pair, n] of counts) {
    const [from, to] = pair.split(">");
    window.imgkeepCountConversion?.(from, to, n);
  }
  counts.clear();
}
