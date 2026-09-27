// Generates the test images: a 320×200 picture with transparent corners, as PNG, SVG, JPG, WebP and AVIF,
// plus animations for the GIF tests (animated.gif, animated.webp, wide.webp, many-frames.webp).
// PNG and SVG are written directly; JPG and WebP are encoded by Chromium; AVIF by macOS `sips`
// (Chromium can decode AVIF but not encode it). Chromium can't encode animated WebP either, so each
// frame is encoded as a still WebP and packed into an animated WebP container here.
// animated.gif is made with the extension's own gifenc. Existing files are kept; pass --force to redo them.
import { existsSync } from "node:fs";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { chromium } from "@playwright/test";
import { encodePng } from "./servers.mjs";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const W = 320, H = 200;
const force = process.argv.includes("--force");
const need = (name) => force || !existsSync(join(DIR, name));

// Transparent background, green rounded panel, yellow circle.
function pixels() {
  const px = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const inPanel = x >= 40 && x < 280 && y >= 30 && y < 170;
      const inCircle = (x - 160) ** 2 + (y - 100) ** 2 <= 45 ** 2;
      if (inCircle) px.set([0xf2, 0xb1, 0x34, 255], i);
      else if (inPanel) px.set([0x0f, 0x6b, 0x5c, 255], i);
    }
  }
  return px;
}

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect x="40" y="30" width="240" height="140" fill="#0f6b5c"/>
  <circle cx="160" cy="100" r="45" fill="#f2b134"/>
</svg>
`;

await mkdir(DIR, { recursive: true });
if (need("photo.png")) await writeFile(join(DIR, "photo.png"), encodePng(W, H, pixels()));
if (need("photo.svg")) await writeFile(join(DIR, "photo.svg"), SVG);

if (need("photo.jpg") || need("photo.webp")) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const png = (await readFile(join(DIR, "photo.png"))).toString("base64");
  const out = await page.evaluate(async (b64) => {
    const bmp = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob());
    const encode = async (mime, quality, fill) => {
      const c = document.createElement("canvas");
      c.width = bmp.width;
      c.height = bmp.height;
      const ctx = c.getContext("2d");
      if (fill) { ctx.fillStyle = fill; ctx.fillRect(0, 0, c.width, c.height); }
      ctx.drawImage(bmp, 0, 0);
      const blob = await new Promise((r) => c.toBlob(r, mime, quality));
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let s = "";
      for (const b of bytes) s += String.fromCharCode(b);
      return btoa(s);
    };
    return { jpg: await encode("image/jpeg", 0.92, "#ffffff"), webp: await encode("image/webp", 0.9) };
  }, png);
  await browser.close();
  if (need("photo.jpg")) await writeFile(join(DIR, "photo.jpg"), Buffer.from(out.jpg, "base64"));
  if (need("photo.webp")) await writeFile(join(DIR, "photo.webp"), Buffer.from(out.webp, "base64"));
}

// ---- Animations ----

// A frame: coloured background, a white square that moves, optionally a transparent top-left corner.
function frameRgba(w, h, i, { transparentCorner = false } = {}) {
  const colours = [[0xd9, 0x3b, 0x3b], [0x2f, 0x9e, 0x44], [0x2f, 0x6f, 0xd9]];
  const [r, g, b] = colours[i % colours.length];
  const px = Buffer.alloc(w * h * 4);
  const sq = Math.min(16, w, h), sx = Math.min(w - sq, 8 + i * 12), sy = Math.floor((h - sq) / 2);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      if (transparentCorner && x < 16 && y < 16) continue; // stays 0,0,0,0
      const inSquare = x >= sx && x < sx + sq && y >= sy && y < sy + sq;
      px.set(inSquare ? [255, 255, 255, 255] : [r, g, b, 255], o);
    }
  }
  return px;
}

// Packs still WebP files into one animated WebP (RIFF: VP8X + ANIM + one ANMF per frame).
function muxAnimatedWebp(frames, width, height, hasAlpha) {
  const u24 = (n) => Buffer.from([n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff]);
  const chunk = (fourcc, data) => {
    const head = Buffer.alloc(8);
    head.write(fourcc, 0, "ascii");
    head.writeUInt32LE(data.length, 4);
    return Buffer.concat([head, data, data.length % 2 ? Buffer.alloc(1) : Buffer.alloc(0)]);
  };
  // Keep a still WebP's image chunks (ALPH, VP8, VP8L); drop its RIFF header and VP8X.
  const imageChunks = (webp) => {
    const out = [];
    for (let o = 12; o + 8 <= webp.length; ) {
      const fourcc = webp.toString("ascii", o, o + 4);
      const size = webp.readUInt32LE(o + 4);
      if (["ALPH", "VP8 ", "VP8L"].includes(fourcc)) out.push(webp.subarray(o, o + 8 + size + (size % 2)));
      o += 8 + size + (size % 2);
    }
    return Buffer.concat(out);
  };
  const vp8x = chunk("VP8X", Buffer.concat([Buffer.from([0x02 | (hasAlpha ? 0x10 : 0), 0, 0, 0]), u24(width - 1), u24(height - 1)]));
  const anim = chunk("ANIM", Buffer.from([0, 0, 0, 0, 0, 0])); // transparent background, loop forever
  const anmf = frames.map(({ webp, durationMs }) =>
    chunk("ANMF", Buffer.concat([u24(0), u24(0), u24(width - 1), u24(height - 1), u24(durationMs), Buffer.from([0x02]), imageChunks(webp)])),
  );
  const body = Buffer.concat([Buffer.from("WEBP", "ascii"), vp8x, anim, ...anmf]);
  const head = Buffer.alloc(8);
  head.write("RIFF", 0, "ascii");
  head.writeUInt32LE(body.length, 4);
  return Buffer.concat([head, body]);
}

// Encodes raw RGBA frames as still WebPs in Chromium.
async function stillWebps(frames) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const out = await page.evaluate(async (list) => {
    const result = [];
    for (const { w, h, b64 } of list) {
      const bytes = Uint8ClampedArray.from(atob(b64), (c) => c.charCodeAt(0));
      const c = new OffscreenCanvas(w, h);
      c.getContext("2d").putImageData(new ImageData(bytes, w, h), 0, 0);
      const blob = await c.convertToBlob({ type: "image/webp", quality: 0.9 });
      const arr = new Uint8Array(await blob.arrayBuffer());
      let s = "";
      for (const x of arr) s += String.fromCharCode(x);
      result.push(btoa(s));
    }
    return result;
  }, frames.map(({ w, h, rgba }) => ({ w, h, b64: rgba.toString("base64") })));
  await browser.close();
  return out.map((b64) => Buffer.from(b64, "base64"));
}

async function animatedWebp(name, w, h, specs) {
  const webps = await stillWebps(specs.map((s, i) => ({ w, h, rgba: frameRgba(w, h, i, s) })));
  const hasAlpha = specs.some((s) => s.transparentCorner);
  const frames = webps.map((webp, i) => ({ webp, durationMs: specs[i].durationMs }));
  await writeFile(join(DIR, name), muxAnimatedWebp(frames, w, h, hasAlpha));
}

if (need("animated.webp")) {
  await animatedWebp("animated.webp", 64, 48, [
    { durationMs: 100 },
    { durationMs: 200, transparentCorner: true },
    { durationMs: 300 },
  ]);
}
if (need("wide.webp")) await animatedWebp("wide.webp", 1000, 100, [{ durationMs: 100 }, { durationMs: 100 }]);
if (need("many-frames.webp")) {
  // 601 frames (one over the limit) of a tiny image: the same still WebP repeated.
  const [tiny] = await stillWebps([{ w: 8, h: 8, rgba: frameRgba(8, 8, 0) }]);
  const frames = Array.from({ length: 601 }, () => ({ webp: tiny, durationMs: 20 }));
  await writeFile(join(DIR, "many-frames.webp"), muxAnimatedWebp(frames, 8, 8, false));
}

if (need("animated.gif")) {
  const { GIFEncoder, quantize, applyPalette } = await import("../extension/lib/gifenc.js");
  const gif = GIFEncoder();
  for (let i = 0; i < 3; i++) {
    const rgba = new Uint8Array(frameRgba(64, 48, i));
    const palette = quantize(rgba, 256);
    gif.writeFrame(applyPalette(rgba, palette), 64, 48, { palette, delay: 100 * (i + 1) });
  }
  gif.finish();
  await writeFile(join(DIR, "animated.gif"), gif.bytes());
}

if (need("photo.avif")) {
  if (process.platform !== "darwin") {
    console.error("photo.avif is missing and can only be generated on macOS (sips). It is checked into the repo.");
    process.exit(1);
  }
  execFileSync("sips", ["-s", "format", "avif", join(DIR, "photo.png"), "--out", join(DIR, "photo.avif")], { stdio: "ignore" });
}

console.log("fixtures ready in tests/fixtures");
