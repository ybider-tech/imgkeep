// Color palette from image: the extension's Get colour palette, in the page. The image is read here, in the
// browser, and never uploaded. The colors come from the extension's own code (lib/palette.js, copied to
// site/convert/lib by npm run site-lib; a test keeps the copy identical). Nothing is sent anywhere: the page's
// only request besides its own files is count.js's anonymous page view.

import { PALETTE_COUNTS, PALETTE_SAMPLE, colourText, extractPalette, paletteCode, toAse, toGpl } from "../convert/lib/palette.js";

const $ = (id) => document.getElementById(id);
const MAX_BYTES = 50 * 1000 * 1000;
const CODE_NAMES = { css: "CSS variables", tailwind: "Tailwind", json: "JSON", list: "List" };

let palettes = null; // { 5: [...], 8: [...], 12: [...] }
let imageName = "image";
let thumbUrl = "";

const checked = (name) => document.querySelector(`input[name="${name}"]:checked`).value;
const current = () => palettes?.[checked("count")] || [];
const percent = (share) => new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: share < 0.01 ? 1 : 0 }).format(share);

function status(text, isError = false) {
  $("status").textContent = text;
  $("status").classList.toggle("error", isError);
}

// Decodes any image the browser can show. SVG and others createImageBitmap refuses go through <img>.
async function decode(file) {
  try {
    return await createImageBitmap(file);
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

// The image's pixels at most PALETTE_SAMPLE px on the longer side, as the extension samples them.
function sample(image) {
  const w = image.width || image.naturalWidth || 1024;
  const h = image.height || image.naturalHeight || 512;
  const scale = Math.min(1, PALETTE_SAMPLE / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
}

async function load(file) {
  if (!file) return;
  if (file.size > MAX_BYTES) return status("That image is over 50 MB. Try a smaller one.", true);
  status("Finding the colors…");
  let image;
  try {
    image = await decode(file);
  } catch {
    return status("This file couldn't be opened as an image. HEIC photos from iPhones can't be opened in Chrome, Edge or Firefox.", true);
  }
  const data = sample(image);
  image.close?.();
  palettes = Object.fromEntries(PALETTE_COUNTS.map((n) => [n, extractPalette(data, n)]));
  imageName = (file.name || "image").replace(/\.[^.]+$/, "").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "").trim() || "image";
  if (thumbUrl) URL.revokeObjectURL(thumbUrl);
  thumbUrl = URL.createObjectURL(file);
  $("thumb").src = thumbUrl;
  if (!palettes[5].length) {
    $("result").hidden = true;
    return status("This image is fully transparent, so it has no colors to take.", true);
  }
  $("result").hidden = false;
  $("drop").classList.add("compact");
  $("dropTitle").textContent = "Drop another image";
  status("");
  render();
}

function render() {
  const colours = current();
  $("bar").replaceChildren(
    ...colours.map((c) => Object.assign(document.createElement("span"), { style: `flex: ${c.share}; background: ${c.hex}` })),
  );
  $("swatches").replaceChildren(
    ...colours.map((c) => {
      const value = colourText(c.hex, checked("format"));
      const label = `Copy ${value} (${percent(c.share)} of the image)`;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pal-swatch";
      button.title = label;
      button.setAttribute("aria-label", label);
      const chip = document.createElement("span");
      chip.className = "pal-chip";
      chip.style.background = c.hex;
      const text = document.createElement("bdi");
      text.className = "pal-value";
      text.dir = "ltr";
      text.textContent = value;
      button.append(chip, text);
      button.addEventListener("click", () => copy(value, `Copied ${value}`, button));
      const li = document.createElement("li");
      li.append(button);
      return li;
    }),
  );
}

async function copy(text, done, button) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    return status("Couldn't copy. Click inside the page, then try again.", true);
  }
  for (const b of $("swatches").querySelectorAll(".copied")) b.classList.remove("copied");
  button?.classList.add("copied");
  status(done);
}

function download(blob, ext) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${imageName}-palette.${ext}`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30_000);
  status(`Saved ${a.download}`);
}

// One block per color with its HEX value underneath, 1200 px wide: the extension's PNG swatch strip.
function swatchStrip(hexes) {
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
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

async function save(kind) {
  const hexes = current().map((c) => c.hex);
  if (kind === "png") return download(await swatchStrip(hexes), "png");
  if (kind === "gpl") return download(new Blob([toGpl(hexes, `${imageName}-palette`)], { type: "application/octet-stream" }), "gpl");
  return download(new Blob([toAse(hexes)], { type: "application/octet-stream" }), "ase");
}

$("choose").addEventListener("click", () => $("file").click());
$("file").addEventListener("change", (e) => load(e.target.files[0]));
const drop = $("drop");
drop.addEventListener("dragover", (e) => (e.preventDefault(), drop.classList.add("over")));
drop.addEventListener("dragleave", () => drop.classList.remove("over"));
drop.addEventListener("drop", (e) => {
  e.preventDefault();
  drop.classList.remove("over");
  load([...e.dataTransfer.files].find((f) => f.type.startsWith("image/") || /\.(svg|ico|bmp|avif|webp)$/i.test(f.name)));
});
addEventListener("paste", (e) => {
  const file = [...(e.clipboardData?.files || [])].find((f) => f.type.startsWith("image/"));
  if (file) load(file);
});
for (const radio of document.querySelectorAll('input[name="count"], input[name="format"]')) radio.addEventListener("change", () => palettes && render());
for (const b of document.querySelectorAll("[data-code]"))
  b.addEventListener("click", () => copy(paletteCode(current().map((c) => c.hex), b.dataset.code, checked("format")), `Copied all colors as ${CODE_NAMES[b.dataset.code]}`));
for (const b of document.querySelectorAll("[data-save]")) b.addEventListener("click", () => save(b.dataset.save));
