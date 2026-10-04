// The image pipeline, shared by every way of saving: quick saves, More options and Copy as PNG.
//   decode → fit to a maximum width → draw (with a background for JPG) → encode → verify
// plus encoding under a file-size cap. Runs in the offscreen document; nothing here makes a network request.
// Pure helpers come first, so tests can import this file in Node.

import { JobError } from "./job-error.js";

// Output types we write, and the file extension each one gets once its bytes have been checked.
export const EXT_BY_TYPE = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

// The type from the file's first bytes. Servers often send the wrong Content-Type,
// and canvas encoders can quietly fall back to PNG, so neither is trusted.
export function typeFromBytes(b) {
  const text = (from, to) => String.fromCharCode(...b.subarray(from, to));
  if (text(0, 4) === "GIF8") return "image/gif";
  if (text(0, 4) === "RIFF" && text(8, 12) === "WEBP") return "image/webp";
  if (b[0] === 0x89 && text(1, 8) === "PNG\r\n\x1a\n") return "image/png";
  if (text(4, 8) === "ftyp" && ["avif", "avis"].includes(text(8, 12))) return "image/avif";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (text(0, 5) === "%PDF-") return "application/pdf";
  return "";
}

export async function sniffImageType(blob) {
  return typeFromBytes(new Uint8Array(await blob.slice(0, 16).arrayBuffer())) || blob.type || "";
}

// Throws unless the bytes really are `type`. Returns the extension that matches them.
export async function verifyOutput(blob, type) {
  const actual = typeFromBytes(new Uint8Array(await blob.slice(0, 16).arrayBuffer()));
  if (!actual || actual !== type || !EXT_BY_TYPE[actual]) throw new JobError("unsupported");
  return EXT_BY_TYPE[actual];
}

// Scale down to maxWidth, keeping the shape. Never enlarges; no maxWidth (0, empty) keeps the size.
export function fitWidth(width, height, maxWidth) {
  const max = Math.floor(Number(maxWidth));
  if (!(max > 0) || width <= max) return { width, height };
  return { width: max, height: Math.max(1, Math.round((height * max) / width)) };
}

// Maximum width from user input: a whole number of pixels, or 0 for "keep the size".
export function cleanMaxWidth(value) {
  const n = Math.floor(Number(String(value ?? "").trim() || 0));
  return Number.isFinite(n) && n > 0 ? Math.min(n, 100_000) : 0;
}

// File-size caps are decimal: 1 KB = 1,000 bytes, 1 MB = 1,000,000 bytes.
export const KB = 1000;
export const MB = 1000 * 1000;

// The lowest encoder quality a size cap may use (0–100). It's a control setting, not a promise about looks.
export const MIN_SIZE_QUALITY = 70;

// Encodes at the highest tested quality whose file fits in maxBytes, with a bounded number of tries
// (a binary search between `floor` and `quality`). `encodeAt(q)` returns a Blob for quality q.
// Throws "size-unreachable" with the smallest size reached if even `floor` is too big.
export async function encodeUnder(encodeAt, { quality, maxBytes, floor = MIN_SIZE_QUALITY, maxTries = 7 }) {
  const first = await encodeAt(quality);
  if (first.size <= maxBytes) return { blob: first, quality };
  let low = floor;
  let high = quality - 1;
  let best = null;
  let smallest = first;
  for (let tries = 1; low <= high && tries < maxTries; tries++) {
    // The first probe goes straight to the floor: if that doesn't fit, nothing will.
    const q = tries === 1 ? low : Math.floor((low + high + 1) / 2);
    const blob = await encodeAt(q);
    if (blob.size < smallest.size) smallest = blob;
    if (blob.size <= maxBytes) {
      best = { blob, quality: q };
      low = q + 1;
    } else if (q === floor) {
      break;
    } else {
      high = q - 1;
    }
  }
  if (!best) throw new JobError("size-unreachable", "", [String(smallest.size)]);
  return best;
}

// ---- Below: browser only ----

async function looksLikeSvg(blob) {
  if (blob.type === "image/svg+xml") return true;
  const head = await blob.slice(0, 512).text();
  return /<svg[\s>]/i.test(head);
}

// Returns { source, width, height, done() } ready for drawImage.
export async function decode(blob) {
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

// Draws the image at width × height. With a background colour (JPG), transparent areas get it.
export function draw(image, { width, height, background }) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image.source, 0, 0, width, height);
  return canvas;
}

// Canvas → Blob of `type`, checked: an encoder that can't make the type falls back to PNG, which is caught here.
export async function encodeCanvas(canvas, type, quality) {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality / 100));
  if (!blob) throw new JobError("too-large");
  await verifyOutput(blob, type);
  return blob;
}

const LOSSY = new Set(["image/jpeg", "image/webp"]);

// The whole still-image pipeline. Returns { blob, ext, width, height, sourceWidth, sourceHeight, quality }.
// options: { type, quality, background, maxWidth, maxBytes, minQuality }
export async function processImage(image, { type, quality, background, maxWidth, maxBytes, minQuality }) {
  const size = fitWidth(image.width, image.height, maxWidth);
  const canvas = draw(image, { ...size, background: type === "image/jpeg" ? background || "#ffffff" : "" });
  try {
    let result = { blob: null, quality: LOSSY.has(type) ? quality : null };
    if (maxBytes > 0 && LOSSY.has(type)) {
      result = await encodeUnder((q) => encodeCanvas(canvas, type, q), { quality, maxBytes, floor: minQuality ?? MIN_SIZE_QUALITY });
    } else {
      result.blob = await encodeCanvas(canvas, type, quality);
    }
    const ext = await verifyOutput(result.blob, type);
    return { blob: result.blob, ext, ...size, sourceWidth: image.width, sourceHeight: image.height, quality: result.quality };
  } finally {
    // Give the canvas memory back straight away instead of waiting for garbage collection.
    canvas.width = canvas.height = 0;
  }
}
