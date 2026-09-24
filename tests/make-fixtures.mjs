// Generates the test images: a 320×200 picture with transparent corners, as PNG, SVG, JPG, WebP and AVIF.
// PNG and SVG are written directly; JPG and WebP are encoded by Chromium; AVIF by macOS `sips`
// (Chromium can decode AVIF but not encode it). Existing files are kept; pass --force to redo them.
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

if (need("photo.avif")) {
  if (process.platform !== "darwin") {
    console.error("photo.avif is missing and can only be generated on macOS (sips). It is checked into the repo.");
    process.exit(1);
  }
  execFileSync("sips", ["-s", "format", "avif", join(DIR, "photo.png"), "--out", join(DIR, "photo.avif")], { stdio: "ignore" });
}

console.log("fixtures ready in tests/fixtures");
