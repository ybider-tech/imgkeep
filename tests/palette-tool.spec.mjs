// Color palette from image on imgkeep.app (site/color-palette-from-image/): the extension's palette code
// (site/convert/lib/palette.js, a checked copy) in the page. The image is read in the browser, never uploaded.
import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { startServer, encodePng } from "./servers.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let server;
test.beforeAll(async () => (server = await startServer({ cors: false, root: join(ROOT, "site") })));
test.afterAll(() => server?.close());

// 300 × 100: 70% teal, 30% orange.
const twoColours = () => {
  const w = 300, h = 100;
  const px = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px.set(x < 210 ? [15, 107, 92, 255] : [242, 140, 40, 255], (y * w + x) * 4);
  return encodePng(w, h, px);
};

async function open(page) {
  const requests = [];
  page.on("request", (r) => requests.push(r.url()));
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(`${server.url}/color-palette-from-image/`, { waitUntil: "networkidle" });
  return { requests, errors };
}

test("an image gives its colors, largest first, copied and saved without leaving the page", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: server.url });
  const { requests, errors } = await open(page);
  const before = requests.length;
  await page.locator("#file").setInputFiles({ name: "brand.png", mimeType: "image/png", buffer: twoColours() });
  const swatches = page.locator(".pal-swatch");
  await expect(swatches).toHaveCount(2);
  await expect(swatches.first()).toHaveAttribute("aria-label", "Copy #0F6B5C (70% of the image)");

  await swatches.nth(1).click();
  await expect(page.locator("#status")).toHaveText("Copied #F28C28");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("#F28C28");

  await page.getByText("HSL", { exact: true }).click();
  await page.getByRole("button", { name: "CSS variables" }).click();
  expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n")).toBe(":root {\n  --color-1: hsl(170, 75%, 24%);\n  --color-2: hsl(30, 89%, 55%);\n}");

  for (const [button, file, head] of [
    ["GIMP palette", "brand-palette.gpl", "GIMP Palette"],
    ["Adobe swatches", "brand-palette.ase", "ASEF"],
    ["PNG swatches", "brand-palette.png", "\x89PNG"],
  ]) {
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: button }).click();
    const d = await download;
    expect(d.suggestedFilename()).toBe(file);
    expect((await readFile(await d.path())).subarray(0, head.length).toString("latin1")).toBe(head);
  }
  // Reading the image, copying and saving asked the network for nothing (the page's own files only).
  expect(requests.slice(before).filter((u) => !u.startsWith("blob:") && !u.startsWith("data:"))).toEqual([]);
  expect(errors).toEqual([]);
});

test("a fully transparent image says so, and a file that isn't an image explains itself", async ({ page }) => {
  await open(page);
  await page.locator("#file").setInputFiles({ name: "clear.png", mimeType: "image/png", buffer: encodePng(4, 4, Buffer.alloc(64)) });
  await expect(page.locator("#status")).toHaveText("This image is fully transparent, so it has no colors to take.");
  await expect(page.locator("#result")).toBeHidden();
  await page.locator("#file").setInputFiles({ name: "notes.png", mimeType: "image/png", buffer: Buffer.from("not an image") });
  await expect(page.locator("#status")).toContainText("couldn't be opened as an image");
});
