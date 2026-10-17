// Turns one image (a Blob) into another format, entirely on this device. Shared by the extension's
// offscreen document and the Free Image Converter page on imgkeep.app (site/convert/, a checked copy):
// one set of conversion code for both. No chrome.* and no network here; the caller fetches the image and,
// for AVIF, hands in the encoder (only offscreen.js may load vendored code).

import { JobError } from "./job-error.js";
import { GIF_LIMITS, nameFromUrl } from "./settings.js";
import { decode, draw, encodeCanvas, fitWidth, processImage, sniffImageType, verifyOutput } from "./image.js";
import { gifSize, openAnimation, stillFrame, checkLimits, fitGif, encodeGif } from "./gif.js";
import { buildPdf, splitAlpha, deflate } from "./pdf.js";
import { buildIco, fitSquare, icoSizes } from "./ico.js";
import { buildBmp } from "./bmp.js";
import { encodeAvif } from "./avif.js";

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
async function toPdf(input, { url, title: givenTitle, quality, maxWidth }) {
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
    const title = givenTitle || nameFromUrl(url); // "image" for data: URLs
    const blob = buildPdf({ width, height, image: pdfImage, title });
    return { blob, width, height, sourceWidth: image.width, sourceHeight: image.height };
  } finally {
    if (canvas) canvas.width = canvas.height = 0;
    image.done();
  }
}

// ICO output: the image at 16, 32 and 48 px (and 256 px when it's big enough), each a square PNG with
// the image centred and transparent edges. Animated images use their first frame.
async function toIco(input) {
  const image = await decode(input);
  try {
    const images = [];
    for (const size of icoSizes(image.width, image.height)) {
      const canvas = new OffscreenCanvas(size, size);
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      const { x, y, w, h } = fitSquare(image.width, image.height, size);
      ctx.drawImage(image.source, x, y, w, h);
      images.push({ size, png: new Uint8Array(await (await canvas.convertToBlob({ type: "image/png" })).arrayBuffer()) });
    }
    const largest = images[images.length - 1].size;
    const blob = new Blob([buildIco(images)], { type: "image/x-icon" });
    return { blob, width: largest, height: largest, sourceWidth: image.width, sourceHeight: image.height };
  } finally {
    image.done();
  }
}

// BMP output: 24-bit, maximum width applied, transparent areas on the background colour (like JPG).
async function toBmp(input, { maxWidth, background }) {
  const image = await decode(input);
  let canvas;
  try {
    const { width, height } = fitWidth(image.width, image.height, maxWidth);
    canvas = draw(image, { width, height, background: background || "#ffffff" });
    let rgba;
    try {
      rgba = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, width, height).data;
    } catch {
      throw new JobError("too-large");
    }
    const blob = new Blob([buildBmp(rgba, width, height)], { type: "image/bmp" });
    return { blob, width, height, sourceWidth: image.width, sourceHeight: image.height };
  } finally {
    if (canvas) canvas.width = canvas.height = 0;
    image.done();
  }
}

// AVIF output: maximum width applied, transparency kept. Animated images use their first frame.
async function toAvif(input, { maxWidth, quality, avifEncoder }) {
  if (!avifEncoder) throw new JobError("unsupported");
  const encoder = await avifEncoder();
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
    const blob = new Blob([encodeAvif(encoder, rgba, width, height, quality)], { type: "image/avif" });
    return { blob, width, height, sourceWidth: image.width, sourceHeight: image.height, quality };
  } finally {
    if (canvas) canvas.width = canvas.height = 0;
    image.done();
  }
}

const MAKERS = { "image/gif": animate, "application/pdf": toPdf, "image/x-icon": toIco, "image/bmp": toBmp, "image/avif": toAvif };

// input: the image Blob. opts: { mime (the output type), quality, background, maxWidth, maxBytes, minQuality,
// url or title (PDF title), avifEncoder (async () => encoder, for AVIF) }.
// Returns { blob, ext, width, height, sourceWidth, sourceHeight, quality, sourceType }, the file checked to
// really be `mime`.
export async function convert(input, opts) {
  const make = MAKERS[opts.mime] || still;
  const out = await make(input, opts);
  // Whatever made it, the file must really be the type it will be named as.
  const ext = await verifyOutput(out.blob, opts.mime);
  return { ...out, ext, quality: out.quality ?? null, sourceType: await sniffImageType(input) };
}
