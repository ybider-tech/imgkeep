// Free Image Converter on imgkeep.app: converts images in this page, on this device. Nothing is uploaded:
// the files are read here, converted with the same code as the Imgkeep extension (./lib, a checked copy of
// extension/lib), and handed back as downloads. The only requests are this page's own files (and the AVIF
// encoder, from this site, only when AVIF is chosen).
import { convert } from "./lib/convert.js";
import { DEFAULTS, FORMATS } from "./lib/settings.js";
import { cleanMaxWidth } from "./lib/image.js";

// AVIF output appears once Imgkeep 0.10.0 (which adds it to the extension) is live.
const AVIF_READY = false;
const MAX_FILES = 20;
const MAX_BYTES = 50 * 1000 * 1000;
const OUTPUTS = ["png", "jpg", "webp", ...(AVIF_READY ? ["avif"] : []), "gif", "pdf", "ico", "bmp"];
const LOSSY = new Set(["jpg", "webp", "avif"]);
const BACKGROUND = new Set(["jpg", "bmp"]);
const AVIF_QUALITY = 60;

const $ = (id) => document.getElementById(id);
const root = $("converter");
if (root) init();

const MESSAGES = {
  decode: "Couldn't read this image. It may be damaged, or a format this browser can't open.",
  unsupported: "This browser can't make that format. Try another format, or Chrome or Edge.",
  "too-large": "This image is too large to convert here.",
  timeout: "This took too long and was stopped.",
  file: "Not an image file.",
  big: "Larger than 50 MB: too large to convert here.",
  unknown: "Something went wrong with this image.",
};

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

const baseName = (name) => (name.replace(/\.[^.]+$/, "") || "image").replace(/[\\/:*?"<>|]+/g, "-").slice(0, 120);
const kb = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);
const short = (mime) => ({ "image/jpeg": "jpg", "image/svg+xml": "svg", "image/x-icon": "ico", "image/vnd.microsoft.icon": "ico" })[mime] || (mime.split("/")[1] || "other").replace(/[^a-z0-9]/g, "");

async function init() {
  const select = $("format");
  const preset = root.dataset.to;
  for (const key of OUTPUTS) {
    const f = FORMATS[key];
    if (!f) continue;
    const opt = new Option(f.label, key);
    if (key === "webp" && !(await canMake("image/webp"))) {
      opt.disabled = true;
      opt.textContent = "WebP (not in this browser)";
    }
    select.append(opt);
  }
  select.value = OUTPUTS.includes(preset) && !select.querySelector(`option[value="${preset}"]`)?.disabled ? preset : "png";
  $("background").value = DEFAULTS.jpgBackground;

  const syncControls = () => {
    const f = select.value;
    $("qualityField").hidden = !LOSSY.has(f);
    $("backgroundField").hidden = !BACKGROUND.has(f);
    $("widthField").hidden = f === "ico";
    if (!$("quality").dataset.touched) $("quality").value = f === "webp" ? DEFAULTS.webpQuality : f === "avif" ? AVIF_QUALITY : DEFAULTS.jpgQuality;
    $("qualityOut").textContent = $("quality").value;
  };
  select.addEventListener("change", syncControls);
  $("quality").addEventListener("input", () => {
    $("quality").dataset.touched = "1";
    $("qualityOut").textContent = $("quality").value;
  });
  syncControls();

  $("files").addEventListener("change", (e) => run([...e.target.files]));
  const drop = $("drop");
  drop.addEventListener("dragover", (e) => {
    e.preventDefault();
    drop.classList.add("over");
  });
  drop.addEventListener("dragleave", () => drop.classList.remove("over"));
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    drop.classList.remove("over");
    run([...e.dataTransfer.files]);
  });
  document.addEventListener("paste", (e) => {
    const files = [...(e.clipboardData?.files || [])];
    if (files.length) run(files);
  });
  $("downloadAll").addEventListener("click", () => {
    for (const a of $("results").querySelectorAll("a[download]")) a.click();
  });
}

let busy = Promise.resolve();
function run(files) {
  busy = busy.then(() => convertAll(files.slice(0, MAX_FILES), files.length > MAX_FILES)).catch(() => {});
}

async function convertAll(files, cut) {
  const key = $("format").value;
  const target = FORMATS[key];
  const opts = {
    mime: target.mime,
    quality: Number($("quality").value),
    background: $("background").value,
    maxWidth: key === "ico" ? 0 : cleanMaxWidth($("maxWidth").value),
    avifEncoder,
  };
  const pairs = new Map();
  $("status").textContent = `Converting ${files.length} ${files.length === 1 ? "image" : "images"} to ${target.label}…${cut ? ` (the first ${MAX_FILES})` : ""}`;
  let done = 0;
  for (const file of files) {
    const item = document.createElement("li");
    item.className = "result";
    item.append(Object.assign(document.createElement("span"), { className: "name", textContent: file.name || "Pasted image" }));
    $("results").prepend(item);
    try {
      if (file.size > MAX_BYTES) throw Object.assign(new Error("big"), { code: "big" });
      if (file.type && !file.type.startsWith("image/")) throw Object.assign(new Error("file"), { code: "file" });
      const out = await convert(file, { ...opts, title: baseName(file.name || "image") });
      const url = URL.createObjectURL(out.blob);
      const name = `${baseName(file.name || "image")}.${out.ext}`;
      if (out.ext !== "pdf") item.prepend(Object.assign(document.createElement("img"), { src: url, alt: "", loading: "lazy" }));
      const change = out.blob.size - file.size;
      const pct = file.size ? Math.round((100 * change) / file.size) : 0;
      item.append(
        Object.assign(document.createElement("span"), {
          className: "facts",
          textContent: `${out.width} × ${out.height} · ${kb(file.size)} → ${kb(out.blob.size)} (${pct > 0 ? "+" : ""}${pct}%)`,
        }),
        Object.assign(document.createElement("a"), { href: url, download: name, className: "button", textContent: `Download ${out.ext.toUpperCase()}` }),
      );
      const pair = `${short(out.sourceType || file.type || "")}>${key}`;
      pairs.set(pair, (pairs.get(pair) || 0) + 1);
      done++;
    } catch (e) {
      item.classList.add("failed");
      item.append(Object.assign(document.createElement("span"), { className: "error", textContent: MESSAGES[e.code] || MESSAGES.unknown }));
    }
  }
  $("status").textContent = done ? `Done: ${done} of ${files.length} converted. Nothing was uploaded.` : "Nothing could be converted.";
  $("downloadAll").hidden = $("results").querySelectorAll("a[download]").length < 2;
  if (done) $("install").hidden = false;
  for (const [pair, n] of pairs) {
    const [from, to] = pair.split(">");
    window.imgkeepCountConversion?.(from, to, n);
  }
}
