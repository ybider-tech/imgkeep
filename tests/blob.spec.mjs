// blob: images (0.12.0): images that only exist inside their page, as on WhatsApp Web or Google Photos.
// Imgkeep reads them in the page (lib/read-blob.js, injected with chrome.scripting) once it has access to that
// page, and asks for that one site in the ask window when it doesn't.
import { test, expect } from "@playwright/test";
import { readFile, rm } from "node:fs/promises";
import { launchWithExtension } from "./launch.mjs";
import { startServer, encodePng } from "./servers.mjs";
import { readBlobInPage } from "../extension/lib/read-blob.js";

let ctx, cors, page;
test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  cors = await startServer({ cors: true });
  ctx = await launchWithExtension();
  page = await ctx.context.newPage();
  await page.goto(`${cors.url}/photo.svg`);
});
test.afterAll(async () => {
  await ctx?.context.close();
  await cors?.close();
  if (ctx) await rm(ctx.userDataDir, { recursive: true, force: true });
});

// A blob: image made by the page itself, like a web app would.
const makeBlobImage = () =>
  page.evaluate(async () => {
    const c = new OffscreenCanvas(40, 20);
    const g = c.getContext("2d");
    g.fillStyle = "#0f6b5c";
    g.fillRect(0, 0, 40, 20);
    return URL.createObjectURL(await c.convertToBlob({ type: "image/png" }));
  });

test("in the page: the reader turns a blob: link into the image's bytes, and refuses anything else", async () => {
  const url = await makeBlobImage();
  const result = await page.evaluate(`(${readBlobInPage.toString()})(${JSON.stringify(url)})`);
  expect(result.dataUrl).toMatch(/^data:image\/png;base64,/);
  expect(await page.evaluate(`(${readBlobInPage.toString()})("https://example.com/a.png")`)).toEqual({ error: "blob" });
});

test("in the extension: read from the page and saved, or the ask window asks for that one site", async () => {
  // Find image here's switch grants scripting (no prompt); host access always needs one, so the page read is
  // stood in for: first it returns the image, then it fails as it does without access.
  const options = await ctx.context.newPage();
  await options.goto(`chrome-extension://${ctx.extensionId}/options.html`);
  await options.locator("#imageFinder").click();
  await expect.poll(() => ctx.sw.evaluate(() => chrome.permissions.contains({ permissions: ["scripting"] }))).toBe(true);
  const png = `data:image/png;base64,${encodePng(40, 20, Buffer.alloc(40 * 20 * 4, 120)).toString("base64")}`;
  await ctx.sw.evaluate((png) => {
    globalThis.realExecute = chrome.scripting.executeScript;
    chrome.scripting.executeScript = async ({ func, args }) => {
      if (globalThis.denyPage) throw new Error("Cannot access contents of the page");
      return [{ result: func.name === "readBlobInPage" && args[0].startsWith("blob:") ? { dataUrl: png } : null }];
    };
  }, png);

  const url = await makeBlobImage();
  const pageUrl = `${cors.url}/photo.svg`;
  // Any real tab will do: the stand-in above doesn't look at it (reading a tab's address would need "tabs").
  const tabId = await ctx.sw.evaluate(() => chrome.tabs.query({}).then((t) => t[0].id));
  const result = await ctx.sw.evaluate(([url, pageUrl, tabId]) => globalThis.imgkeepRunJob({ url, pageUrl, tabId, frameId: 0, format: "jpg" }, { interactive: false }), [url, pageUrl, tabId]);
  expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
  const [d] = await ctx.sw.evaluate((id) => chrome.downloads.search({ id }), result.downloadId);
  expect(d.filename).toMatch(/\.jpg$/);

  // Without access to the page: the ask window explains and asks for this one site.
  await ctx.sw.evaluate(() => (globalThis.denyPage = true));
  const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/ask.html") });
  await ctx.sw.evaluate(([url, pageUrl, tabId]) => globalThis.imgkeepMenuClicked({ menuItemId: "imgkeep-png", srcUrl: url, pageUrl, frameId: 0 }, { id: tabId }), [url, pageUrl, tabId]);
  const ask = await opened;
  await expect(ask.locator("#title")).toHaveText("Allow Imgkeep to read this image on this site?");
  await expect(ask.locator("#body strong")).toHaveText("127.0.0.1");
  await expect(ask.getByRole("button", { name: "Allow and save" })).toBeVisible();
  await ask.close();
  // Copy as PNG on a blob: image goes the same way, with the copy's own button.
  const opened2 = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/ask.html") });
  await ctx.sw.evaluate(([url, pageUrl, tabId]) => globalThis.imgkeepMenuClicked({ menuItemId: "imgkeep-copy", srcUrl: url, pageUrl, frameId: 0 }, { id: tabId }), [url, pageUrl, tabId]);
  const ask2 = await opened2;
  await expect(ask2.getByRole("button", { name: "Allow and copy" })).toBeVisible();
  await ask2.close();
  await ctx.sw.evaluate(() => (chrome.scripting.executeScript = globalThis.realExecute));
});

test("the new site question reads clearly", async () => {
  const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/ask.html") });
  const plain = await startServer({ cors: false });
  await ctx.sw.evaluate((url) => globalThis.imgkeepRunJob({ url, format: "png" }), `${plain.url}/photo.webp`);
  const ask = await opened;
  await expect(ask.locator("#title")).toHaveText("Allow Imgkeep to get images from this site?");
  await expect(ask.locator("#body")).toContainText("only lets its own pages load its images");
  await expect(ask.locator("#body")).toContainText("Only for this site, and only the images you choose to save.");
  await ask.close();
  await plain.close();
});
