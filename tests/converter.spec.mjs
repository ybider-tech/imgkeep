// The Free Image Converter on imgkeep.app (site/convert/): converts in the page, nothing uploaded, the same
// code as the extension (site/convert/lib is a checked copy of extension/lib).
import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
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

// Opens the converter, watching every request, and drops files on it like a visitor would.
async function open(page, path = "/convert/") {
  const requests = [];
  page.on("request", (r) => requests.push(r.url()));
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(`${server.url}${path}`);
  await expect(page.locator("#format option").first()).toBeAttached();
  return { requests, errors };
}
async function drop(page, files) {
  await page.evaluate(async (files) => {
    const dt = new DataTransfer();
    for (const f of files) dt.items.add(new File([Uint8Array.from(atob(f.b64), (c) => c.charCodeAt(0))], f.name, { type: f.type }));
    document.getElementById("drop").dispatchEvent(new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true }));
  }, files);
}
const fixture = async (name, type) => ({ name, type, b64: (await readFile(join(FIX, name))).toString("base64") });
const downloaded = (page) =>
  page.evaluate(async () =>
    Promise.all(
      [...document.querySelectorAll(".result a[download]")].map(async (a) => {
        const bytes = new Uint8Array(await (await fetch(a.href)).arrayBuffer());
        return { name: a.download, head: [...bytes.slice(0, 12)] };
      }),
    ),
  );
const text = (head) => String.fromCharCode(...head);

test("WebP → JPG in the page: a real JPEG, the right name, no upload, then the install box", async ({ page }) => {
  const { requests, errors } = await open(page);
  await page.selectOption("#format", "jpg");
  await expect(page.locator("#backgroundField")).toBeVisible();
  await expect(page.locator("#qualityField")).toBeVisible();
  const before = requests.length;
  await drop(page, [await fixture("photo.webp", "image/webp")]);
  await expect(page.locator("#status")).toContainText("Done: 1 of 1 converted. Nothing was uploaded.");
  const [file] = await downloaded(page);
  expect(file.name).toBe("photo.jpg");
  expect(file.head.slice(0, 3)).toEqual([0xff, 0xd8, 0xff]);
  // Converting asked the network for nothing (blob: reads of our own results don't leave the page).
  expect(requests.slice(before).filter((u) => !u.startsWith("blob:"))).toEqual([]);
  await expect(page.locator("#install")).toBeVisible();
  await expect(page.locator("#install a").first()).toHaveAttribute("href", /utm_campaign=convert/);
  expect(errors).toEqual([]);
});

test("every output the converter offers comes out as that format", async ({ page }) => {
  await open(page);
  const offered = await page.locator("#format option:not([disabled])").evaluateAll((o) => o.map((x) => x.value));
  expect(offered).toEqual(["png", "jpg", "webp", "avif", "gif", "pdf", "ico", "bmp"]);
  const expectHead = { png: [0x89, 0x50, 0x4e, 0x47], jpg: [0xff, 0xd8, 0xff], webp: "RIFF", avif: "....ftypavif", gif: "GIF8", pdf: "%PDF", ico: [0, 0, 1, 0], bmp: "BM" };
  for (const key of offered) {
    await page.evaluate(() => (document.getElementById("results").innerHTML = ""));
    await page.selectOption("#format", key);
    await drop(page, [await fixture("photo.png", "image/png")]);
    await expect(page.locator("#status")).toContainText("Done: 1 of 1");
    const [file] = await downloaded(page);
    expect(file.name).toBe(`photo.${key}`);
    const want = expectHead[key];
    if (want === "....ftypavif") expect(text(file.head).slice(4, 12), key).toBe("ftypavif");
    else if (typeof want === "string") expect(text(file.head).slice(0, want.length)).toBe(want);
    else expect(file.head.slice(0, want.length)).toEqual(want);
  }
});

test("several files at once, and a broken one says so without stopping the others", async ({ page }) => {
  await open(page);
  await page.selectOption("#format", "png");
  await drop(page, [
    await fixture("photo.webp", "image/webp"),
    { name: "broken.png", type: "image/png", b64: Buffer.from("not an image").toString("base64") },
    await fixture("photo.avif", "image/avif"),
  ]);
  await expect(page.locator("#status")).toContainText("Done: 2 of 3 converted");
  await expect(page.locator(".result.failed .error")).toContainText("Couldn't read this image");
  await expect(page.locator("#downloadAll")).toBeVisible();
});

test("ICO hides the width field; quality only shows for lossy formats", async ({ page }) => {
  await open(page);
  await page.selectOption("#format", "ico");
  await expect(page.locator("#widthField")).toBeHidden();
  await expect(page.locator("#qualityField")).toBeHidden();
  await page.selectOption("#format", "png");
  await expect(page.locator("#widthField")).toBeVisible();
  await expect(page.locator("#qualityField")).toBeHidden();
});

test("maximum width applies", async ({ page }) => {
  await open(page);
  await page.selectOption("#format", "png");
  await page.fill("#maxWidth", "100");
  const w = 400, h = 200;
  const png = encodePng(w, h, Buffer.alloc(w * h * 4, 255));
  await drop(page, [{ name: "wide.png", type: "image/png", b64: png.toString("base64") }]);
  await expect(page.locator(".result .facts")).toContainText("100 × 50");
});

test("the conversion count gets only the format pair and the number of files", async ({ page }) => {
  await page.addInitScript(() => {
    window.__counted = [];
    Object.defineProperty(window, "imgkeepCountConversion", { get: () => (...a) => window.__counted.push(a), set: () => {} });
  });
  await open(page);
  await page.selectOption("#format", "jpg");
  await drop(page, [await fixture("photo.webp", "image/webp"), await fixture("photo.webp", "image/webp")]);
  await expect(page.locator("#status")).toContainText("Done: 2 of 2");
  expect(await page.evaluate(() => window.__counted)).toEqual([["webp", "jpg", 2]]);
});

test("each result offers Download as the chosen format and Copy as PNG, which puts a real PNG on the clipboard", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: server.url });
  await open(page);
  await page.selectOption("#format", "jpg");
  await drop(page, [await fixture("photo.webp", "image/webp")]);
  const result = page.locator(".result").first();
  await expect(result.getByRole("link", { name: "Download JPG" })).toBeVisible();
  await result.getByRole("button", { name: "Copy as PNG" }).click();
  await expect(result.getByRole("button", { name: "Copied ✓" })).toBeVisible();
  const pasted = await page.evaluate(async () => {
    const [item] = await navigator.clipboard.read();
    const png = await item.getType("image/png");
    return [...new Uint8Array(await png.arrayBuffer()).slice(0, 4)];
  });
  expect(pasted).toEqual([0x89, 0x50, 0x4e, 0x47]); // a PNG, though the download is a JPG
});

test("works offline once the page has loaded: every format except AVIF (its encoder loads when first chosen)", async ({ page, context }) => {
  await open(page);
  await context.setOffline(true);
  const offered = (await page.locator("#format option:not([disabled])").evaluateAll((o) => o.map((x) => x.value))).filter((f) => f !== "avif");
  for (const key of offered) {
    await page.evaluate(() => (document.getElementById("results").innerHTML = ""));
    await page.selectOption("#format", key);
    await drop(page, [await fixture("photo.webp", "image/webp")]);
    await expect(page.locator("#status"), key).toContainText("Done: 1 of 1");
  }
  await context.setOffline(false);
});

test("pair pages start on their format, and the menu still offers every format", async ({ page }) => {
  for (const [path, to] of [["/convert/", "png"], ["/webp-to-jpg/", "jpg"], ["/webp-to-png/", "png"], ["/avif-to-jpg/", "jpg"], ["/png-to-jpg/", "jpg"], ["/png-to-ico/", "ico"]]) {
    await open(page, path);
    await expect(page.locator("#format"), path).toHaveValue(to);
    expect(await page.locator("#format option").count(), path).toBe(8);
  }
});

test("a pair page converts like the main page, with its own store-link campaign", async ({ page }) => {
  const { errors } = await open(page, "/avif-to-jpg/");
  await drop(page, [await fixture("photo.avif", "image/avif")]);
  await expect(page.locator("#status")).toContainText("Done: 1 of 1");
  const [file] = await downloaded(page);
  expect(file.name).toBe("photo.jpg");
  await expect(page.locator("#install a.cta")).toHaveAttribute("href", /utm_medium=converter&utm_campaign=avif-to-jpg/);
  expect(errors).toEqual([]);
});

test("before converting, only the drop zone and settings show: no Download all, no install box", async ({ page }) => {
  await open(page);
  await expect(page.locator("#downloadAll")).toBeHidden();
  await expect(page.locator("#install")).toBeHidden();
  await expect(page.locator("#drop")).toBeVisible();
});

test("AVIF: the encoder comes from this site only, and only once AVIF is chosen", async ({ page }) => {
  const { requests } = await open(page);
  expect(requests.some((u) => u.includes("avif_enc"))).toBe(false); // not loaded for everyone
  await page.selectOption("#format", "avif");
  await drop(page, [await fixture("photo.png", "image/png")]);
  await expect(page.locator("#status")).toContainText("Done: 1 of 1", { timeout: 20000 });
  const enc = requests.filter((u) => u.includes("avif_enc"));
  expect(enc.length).toBeGreaterThan(0);
  expect(enc.every((u) => u.startsWith(server.url))).toBe(true);
});
