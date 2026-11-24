// The Free Image Converter on imgkeep.app (site/convert/): converts in the page, nothing uploaded, the same
// code as the extension (site/convert/lib is a checked copy of extension/lib). Layout "Format First":
// 01 choose the output, 02 add images, results below.
import { test, expect } from "@playwright/test";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { startServer, encodePng } from "./servers.mjs";
import { SITE_LIB, SITE_VENDOR } from "../scripts/site-lib.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FIX = join(ROOT, "tests", "fixtures");
let server;
test.beforeAll(async () => (server = await startServer({ cors: false, root: join(ROOT, "site") })));
test.afterAll(() => server?.close());

test("the site's conversion code is an exact copy of the extension's (npm run site-lib)", async () => {
  for (const file of [...SITE_LIB, ...SITE_VENDOR]) {
    const a = await readFile(join(ROOT, "extension", file));
    const b = await readFile(join(ROOT, "site", "convert", file));
    expect(b.equals(a), `site/convert/${file} differs from extension/${file}: run npm run site-lib`).toBe(true);
  }
});

// The HEIC decoder (website only) is pinned to the bytes of libheif-js 1.23.5, like the extension's AVIF encoder
// (site/convert/vendor/heic/README says how to check them).
const HEIC_VENDOR = {
  "libheif.js": "376c0bb483c23ac458cd22d718074693748ea75eddc3e4929353d4153e365a2e",
  "libheif.wasm": "184d3d20f8323877f13e9f5254f9c6a0ce272c9a3a2f823b0b2bcd2ee9f73f80",
};
test("the HEIC decoder is the pinned libheif build, with its licence and notes", async () => {
  const dir = join(ROOT, "site", "convert", "vendor", "heic");
  expect((await readdir(dir)).sort()).toEqual(["LICENSE-libheif", "README", "libheif.js", "libheif.wasm"]);
  for (const [file, sha] of Object.entries(HEIC_VENDOR)) {
    expect(createHash("sha256").update(await readFile(join(dir, file))).digest("hex"), file).toBe(sha);
  }
});

// Opens the converter, watching every request and error.
async function open(page, path = "/convert/") {
  const requests = [];
  page.on("request", (r) => requests.push(r.url()));
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(`${server.url}${path}`);
  await expect(page.locator("#converter")).toHaveAttribute("data-ready", "1");
  return { requests, errors };
}
// Picks an output the way a visitor does: a tile, or More formats then the item.
async function pick(page, key) {
  if (["png", "jpg", "webp"].includes(key)) return page.click(`.cv-formats > [data-format="${key}"]`);
  await page.click("#moreBtn");
  await page.click(`#moreMenu [data-format="${key}"]`);
}
async function drop(page, files) {
  await page.evaluate(async (files) => {
    const dt = new DataTransfer();
    for (const f of files) dt.items.add(new File([Uint8Array.from(atob(f.b64), (c) => c.charCodeAt(0))], f.name, { type: f.type }));
    document.getElementById("drop").dispatchEvent(new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true }));
  }, files);
}
const fixture = async (name, type) => ({ name, type, b64: (await readFile(join(FIX, name))).toString("base64") });
const pngFile = (name, w = 40, h = 30) => ({ name, type: "image/png", b64: encodePng(w, h, Buffer.alloc(w * h * 4, 200)).toString("base64") });
const downloaded = (page) =>
  page.evaluate(async () =>
    Promise.all(
      [...document.querySelectorAll(".cv-row a[download]")].map(async (a) => {
        const bytes = new Uint8Array(await (await fetch(a.href)).arrayBuffer());
        return { name: a.download, label: a.textContent, head: [...bytes.slice(0, 12)] };
      }),
    ),
  );
const text = (head) => String.fromCharCode(...head);
const ready = (page, n) => expect(page.locator(".cv-row .cv-download")).toHaveCount(n, { timeout: 20000 });

test("empty state: output first, then the upload area; no results, no install line", async ({ page }) => {
  await open(page);
  await expect(page.locator(".cv-formats")).toHaveAttribute("aria-label", "Output format");
  await expect(page.locator('.cv-formats > [data-format="png"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#formatHelper")).toHaveText("PNG keeps transparency.");
  await expect(page.locator("#dropTitle")).toHaveText("Drop images to convert to PNG");
  await expect(page.getByRole("button", { name: "Choose images" })).toBeVisible();
  await expect(page.locator("#advanced")).toBeHidden(); // advanced options start collapsed
  await expect(page.locator(".cv-how")).not.toHaveAttribute("open", ""); // so does the technical proof
  await expect(page.locator(".cv-privacy")).toContainText("No images, file names or sizes sent.");
  await expect(page.locator("#resultsArea")).toBeHidden();
  await expect(page.locator("#install")).toBeHidden();
});

test("WebP → JPG in the page: a real JPEG, the right name, no upload, then the extension line", async ({ page }) => {
  const { requests, errors } = await open(page);
  await pick(page, "jpg");
  await expect(page.locator("#formatHelper")).toContainText("JPG works well for photos");
  const before = requests.length;
  await drop(page, [await fixture("photo.webp", "image/webp")]);
  await ready(page, 1);
  const [file] = await downloaded(page);
  expect(file).toMatchObject({ name: "photo.jpg", label: "Download JPG" });
  expect(file.head.slice(0, 3)).toEqual([0xff, 0xd8, 0xff]);
  expect(requests.slice(before).filter((u) => !u.startsWith("blob:"))).toEqual([]); // no request while converting
  await expect(page.locator(".cv-row .cv-from")).toHaveText("From photo.webp");
  await expect(page.locator("#summary")).toHaveText("1 ready");
  await expect(page.locator("#install")).toBeVisible();
  await expect(page.locator("#install a")).toHaveAttribute("href", /utm_medium=converter&utm_campaign=convert/);
  expect(errors).toEqual([]);
});

test("every output the converter offers comes out as that format", async ({ page }) => {
  await open(page);
  const offered = await page.locator("[data-format]:not([disabled])").evaluateAll((b) => b.map((x) => x.dataset.format));
  expect(offered).toEqual(["png", "jpg", "webp", "avif", "gif", "pdf", "ico", "bmp"]);
  const want = { png: [0x89, 0x50, 0x4e, 0x47], jpg: [0xff, 0xd8, 0xff], webp: "RIFF", gif: "GIF8", pdf: "%PDF", ico: [0, 0, 1, 0], bmp: "BM" };
  await drop(page, [await fixture("photo.png", "image/png")]);
  for (const key of offered) {
    await pick(page, key);
    await expect(page.locator(".cv-download")).toHaveText(`Download ${key === "jpg" ? "JPG" : key === "webp" ? "WebP" : key.toUpperCase()}`, { timeout: 20000 });
    const [file] = await downloaded(page);
    expect(file.name, key).toBe(`photo.${key}`);
    if (key === "avif") expect(text(file.head).slice(4, 12)).toBe("ftypavif");
    else if (typeof want[key] === "string") expect(text(file.head).slice(0, want[key].length), key).toBe(want[key]);
    else expect(file.head.slice(0, want[key].length), key).toEqual(want[key]);
  }
});

test("More formats: the tile shows the chosen format; Escape closes and returns focus", async ({ page }) => {
  await open(page);
  await page.click("#moreBtn");
  await expect(page.locator("#moreBtn")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#moreMenu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#moreMenu")).toBeHidden();
  await expect(page.locator("#moreBtn")).toBeFocused();
  await pick(page, "gif");
  await expect(page.locator("#moreName")).toHaveText("GIF");
  await expect(page.locator("#moreBtn")).toHaveClass(/selected/);
  await expect(page.locator('.cv-formats > [data-format="png"]')).toHaveAttribute("aria-pressed", "false"); // never PNG lit while making GIF
  await expect(page.locator("#currentFormat")).toHaveText("GIF");
  await pick(page, "png");
  await expect(page.locator("#moreName")).toHaveText("More formats");
});

test("changing the format converts again, and never shows an old file under the new label", async ({ page }) => {
  await open(page);
  await drop(page, [await fixture("photo.webp", "image/webp")]);
  await ready(page, 1);
  await pick(page, "jpg");
  await expect(page.locator(".cv-download")).toHaveText("Download JPG", { timeout: 20000 });
  await expect(page.locator(".cv-row a[download]")).toHaveCount(1);
  const [file] = await downloaded(page);
  expect(file.name).toBe("photo.jpg");
  expect(file.head.slice(0, 3)).toEqual([0xff, 0xd8, 0xff]);
});

test("several files at once: a broken one explains itself, the rest stay usable", async ({ page }) => {
  await open(page);
  await drop(page, [
    await fixture("photo.webp", "image/webp"),
    { name: "broken.png", type: "image/png", b64: Buffer.from("not an image").toString("base64") },
    await fixture("photo.avif", "image/avif"),
  ]);
  await ready(page, 2);
  await expect(page.locator("#summary")).toHaveText("2 ready · 1 couldn't be converted");
  await expect(page.locator(".cv-row.failed .cv-error").first()).toContainText("We couldn't convert broken.png");
  await expect(page.locator("#downloadAll")).toBeVisible();
});

// HEIC (iPhone photos, since 24 November 2026). Chrome, Edge and Firefox can't open HEIC, so heic.js hands it to
// heic-worker.js and libheif (WebAssembly, site/convert/vendor/heic). quadrants-p3.heic: 96 × 64, made with
// macOS sips from four sRGB colours and saved in Display P3, like an iPhone photo; the worker turns it back to sRGB.
const QUADRANTS = [[200, 40, 40], [40, 160, 60], [40, 70, 200], [230, 200, 40]]; // top-left, top-right, bottom-left, bottom-right
test("HEIC: decoded on this device into sRGB the right way round, the decoder from this site and only when a HEIC is added", async ({ page }) => {
  const { requests, errors } = await open(page);
  const decoder = () => requests.filter((u) => /heic-worker|libheif|heic\.js/.test(u));
  await drop(page, [await fixture("photo.png", "image/png")]);
  await ready(page, 1);
  expect(decoder(), "nothing HEIC loads for other images").toEqual([]);
  // Windows gives HEIC files no type, and some have no extension: the bytes decide.
  await drop(page, [{ ...(await fixture("quadrants-p3.heic", "")), name: "IMG_0001" }]);
  await ready(page, 2);
  expect(decoder().length).toBeGreaterThan(0);
  expect(decoder().every((u) => u.startsWith(server.url))).toBe(true);
  const row = page.locator(".cv-row").filter({ hasText: "IMG_0001" });
  await expect(row.locator(".cv-meta")).toContainText("96 × 64 · PNG");
  const corners = await row.locator("a[download]").evaluate(async (a) => {
    const bmp = await createImageBitmap(await (await fetch(a.href)).blob());
    const ctx = new OffscreenCanvas(bmp.width, bmp.height).getContext("2d");
    ctx.drawImage(bmp, 0, 0);
    return [[24, 16], [72, 16], [24, 48], [72, 48]].map(([x, y]) => [...ctx.getImageData(x, y, 1, 1).data.slice(0, 3)]);
  });
  corners.forEach((rgb, i) => rgb.forEach((v, c) => expect(Math.abs(v - QUADRANTS[i][c]), `quadrant ${i} channel ${c}: ${rgb}`).toBeLessThanOrEqual(8)));
  expect(errors).toEqual([]);
});

test("HEIC: a damaged photo says so, and a JPG named .heic is converted as the JPG it is", async ({ page }) => {
  await open(page, "/heic-to-jpg/");
  const heic = await readFile(join(FIX, "quadrants-p3.heic"));
  await drop(page, [
    { name: "cut.heic", type: "image/heic", b64: heic.subarray(0, heic.length - 200).toString("base64") },
    { ...(await fixture("photo.jpg", "image/heic")), name: "really-a.heic" },
  ]);
  await ready(page, 1);
  await expect(page.locator(".cv-row.failed")).toContainText("This HEIC photo couldn't be opened");
  const [file] = await downloaded(page);
  expect(file.name).toBe("really-a.jpg");
});

test("HEIC brands: HEIC and HEIF files are recognised, AVIF (same container) is not", async () => {
  const { isHeicBytes } = await import("../site/convert/heic.js");
  expect(isHeicBytes(await readFile(join(FIX, "quadrants-p3.heic")))).toBe(true);
  expect(isHeicBytes(await readFile(join(FIX, "photo.avif")))).toBe(false);
  expect(isHeicBytes(await readFile(join(FIX, "photo.png")))).toBe(false);
});

test("up to 20 files: the 21st is refused with a reason, never silently dropped", async ({ page }) => {
  await open(page);
  await drop(page, Array.from({ length: 21 }, (_, i) => pngFile(`img-${i + 1}.png`)));
  await ready(page, 20);
  await expect(page.locator(".cv-row.failed")).toContainText("You can add up to 20 files. Remove an image to add img-21.png.");
});

test("Remove clears the row; removing everything brings back the empty upload area", async ({ page }) => {
  await open(page);
  await drop(page, [await fixture("photo.webp", "image/webp")]);
  await ready(page, 1);
  await expect(page.locator("#dropTitle")).toHaveText("Add more images to convert to PNG");
  await page.getByRole("button", { name: "Remove photo.webp" }).click();
  await expect(page.locator(".cv-row")).toHaveCount(0);
  await expect(page.locator("#resultsArea")).toBeHidden();
  await expect(page.locator("#dropTitle")).toHaveText("Drop images to convert to PNG");
});

test("advanced options: only the settings that apply; a bad width converts nothing and says why", async ({ page }) => {
  await open(page);
  await page.click("#advToggle");
  await expect(page.locator("#advToggle")).toHaveAttribute("aria-expanded", "true");
  await pick(page, "ico");
  await expect(page.locator("#widthField")).toBeHidden();
  await expect(page.locator("#qualityField")).toBeHidden();
  await pick(page, "png");
  await expect(page.locator("#widthField")).toBeVisible();
  await expect(page.locator("#qualityField")).toBeHidden();
  await expect(page.locator("#backgroundField")).toBeHidden();
  await pick(page, "jpg");
  await expect(page.locator("#quality")).toHaveValue("92");
  await expect(page.locator("#backgroundHex")).toHaveValue("#FFFFFF");
  await page.fill("#maxWidth", "abc");
  await expect(page.locator("#widthError")).toBeVisible();
  await drop(page, [await fixture("photo.webp", "image/webp")]);
  await expect(page.locator(".cv-row .cv-state")).toHaveText("Waiting: fix the setting above");
  await page.fill("#maxWidth", "100");
  await expect(page.locator(".cv-row .cv-meta")).toContainText("100 ×", { timeout: 20000 });
});

test("the conversion count gets only the format pair and the number of files, once per file and format", async ({ page }) => {
  await page.addInitScript(() => {
    window.__counted = [];
    Object.defineProperty(window, "imgkeepCountConversion", { get: () => (...a) => window.__counted.push(a), set: () => {} });
  });
  await open(page);
  await pick(page, "jpg");
  await drop(page, [await fixture("photo.webp", "image/webp"), await fixture("photo.webp", "image/webp")]);
  await ready(page, 2);
  await expect.poll(() => page.evaluate(() => window.__counted)).toEqual([["webp", "jpg", 2]]);
});

test("Copy as PNG puts a real PNG on the clipboard, though the download is a JPG", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: server.url });
  await open(page);
  await pick(page, "jpg");
  await drop(page, [await fixture("photo.webp", "image/webp")]);
  await ready(page, 1);
  await page.getByRole("button", { name: "Copy as PNG" }).click();
  await expect(page.getByRole("button", { name: "Copied as PNG" })).toBeVisible();
  const pasted = await page.evaluate(async () => {
    const [item] = await navigator.clipboard.read();
    return [...new Uint8Array(await (await item.getType("image/png")).arrayBuffer()).slice(0, 4)];
  });
  expect(pasted).toEqual([0x89, 0x50, 0x4e, 0x47]);
});

test("works offline once the page has loaded: every format except AVIF (its encoder loads when first chosen)", async ({ page, context }) => {
  await open(page);
  await context.setOffline(true);
  await drop(page, [await fixture("photo.webp", "image/webp")]);
  for (const key of ["png", "jpg", "webp", "gif", "pdf", "ico", "bmp"]) {
    await pick(page, key);
    await expect(page.locator(".cv-row .cv-state"), key).toHaveText("✓ Ready", { timeout: 20000 });
  }
  await context.setOffline(false);
});

test("AVIF: the encoder comes from this site only, and only once AVIF is chosen", async ({ page }) => {
  const { requests } = await open(page);
  expect(requests.some((u) => u.includes("avif_enc"))).toBe(false);
  await pick(page, "avif");
  await drop(page, [await fixture("photo.png", "image/png")]);
  await ready(page, 1);
  const enc = requests.filter((u) => u.includes("avif_enc"));
  expect(enc.length).toBeGreaterThan(0);
  expect(enc.every((u) => u.startsWith(server.url))).toBe(true);
});

test("pair pages start on their format, with every format still on offer", async ({ page }) => {
  for (const [path, to] of [["/convert/", "png"], ["/webp-to-jpg/", "jpg"], ["/webp-to-png/", "png"], ["/avif-to-jpg/", "jpg"], ["/png-to-jpg/", "jpg"], ["/heic-to-jpg/", "jpg"], ["/heic-to-png/", "png"], ["/png-to-ico/", "ico"]]) {
    await open(page, path);
    await expect(page.locator(`[data-format="${to}"]`), path).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("[data-format]"), path).toHaveCount(8);
  }
  await expect(page.locator("#moreName")).toHaveText("ICO");
});

test("a pair page converts like the main page, with its own store-link campaign", async ({ page }) => {
  const { errors } = await open(page, "/avif-to-jpg/");
  await drop(page, [await fixture("photo.avif", "image/avif")]);
  await ready(page, 1);
  const [file] = await downloaded(page);
  expect(file.name).toBe("photo.jpg");
  await expect(page.locator("#install a")).toHaveAttribute("href", /utm_medium=converter&utm_campaign=avif-to-jpg/);
  expect(errors).toEqual([]);
});

test("phone width: two-by-two formats, a full-width button, no sideways scrolling", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 320, height: 800 } });
  const page = await ctx.newPage();
  await open(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const [a, b, c] = await Promise.all(['[data-format="png"]', '[data-format="jpg"]', '[data-format="webp"]'].map((s) => page.locator(`.cv-formats > ${s}`).boundingBox()));
  expect(a.y).toBe(b.y); // PNG and JPG on the first row
  expect(c.y).toBeGreaterThan(a.y); // WebP on the second
  const btn = await page.locator("#choose").boundingBox();
  const zone = await page.locator("#drop").boundingBox();
  expect(btn.width).toBeGreaterThan(zone.width - 60);
  await ctx.close();
});
