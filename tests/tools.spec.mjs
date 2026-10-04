// 0.6.0: the shared pipeline (checked output, maximum width, size cap), Copy as PNG, More options,
// error handling and clean-up. The real extension in Chromium, like extension.spec.mjs.
import { test, expect } from "@playwright/test";
import { readFile, rm } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { launchWithExtension } from "./launch.mjs";
import { startServer, encodePng } from "./servers.mjs";

let ctx, cors, plain, blank;

test.describe.configure({ mode: "serial" });

// A 2400 × 1200 PNG: transparent left half, opaque blue right half.
const wide = (() => {
  const w = 2400, h = 1200;
  const px = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = w / 2; x < w; x++) px.set([20, 60, 200, 255], (y * w + x) * 4);
  return `data:image/png;base64,${encodePng(w, h, px).toString("base64")}`;
})();

// 1200 × 1200 of opaque noise: JPG can't make that small without dropping quality a lot.
const noise = (() => {
  const w = 1200, h = 1200;
  const px = randomBytes(w * h * 4);
  for (let i = 3; i < px.length; i += 4) px[i] = 255;
  return `data:image/png;base64,${encodePng(w, h, px).toString("base64")}`;
})();

test.beforeAll(async () => {
  [cors, plain] = await Promise.all([startServer({ cors: true }), startServer({ cors: false })]);
  ctx = await launchWithExtension();
  blank = await ctx.context.newPage();
  await blank.goto(`${cors.url}/photo.svg`);
  // The test page reads the clipboard back (it isn't the extension, which never reads it).
  await ctx.context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: cors.url });
  // Lets a test make the clipboard refuse (chrome.storage.local.failClipboard = true), like a denied permission.
  await ctx.context.addInitScript(() => {
    if (location.protocol !== "chrome-extension:" || !navigator.clipboard) return;
    const write = navigator.clipboard.write.bind(navigator.clipboard);
    navigator.clipboard.write = async (items) => {
      const { failClipboard } = await chrome.storage.local.get("failClipboard");
      if (failClipboard) throw new DOMException("Write permission denied.", "NotAllowedError");
      return write(items);
    };
  });
});

test.afterAll(async () => {
  await ctx?.context.close();
  await Promise.all([cors?.close(), plain?.close()]);
  if (ctx) await rm(ctx.userDataDir, { recursive: true, force: true });
});

test.afterEach(async () => {
  await ctx.sw.evaluate(() => Promise.all([chrome.storage.sync.clear(), chrome.storage.local.clear()]));
});

const run = (input, opts) => ctx.sw.evaluate(([input, opts]) => globalThis.imgkeepRunJob(input, opts), [input, opts]);

const waitForDownload = (id) =>
  ctx.sw.evaluate(async (id) => {
    for (let i = 0; i < 300; i++) {
      const [d] = await chrome.downloads.search({ id });
      if (d && d.state !== "in_progress") return { state: d.state, filename: d.filename, mime: d.mime, error: d.error };
      await new Promise((r) => setTimeout(r, 100));
    }
    return { state: "timeout" };
  }, id);

const downloadCount = () => ctx.sw.evaluate(() => chrome.downloads.search({}).then((all) => all.length));

function sniff(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") return "image/webp";
  return "unknown";
}

const decode = (bytes) =>
  blank.evaluate(async (b64) => {
    const arr = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const bmp = await createImageBitmap(new Blob([arr]));
    const c = new OffscreenCanvas(bmp.width, bmp.height);
    const g = c.getContext("2d");
    g.drawImage(bmp, 0, 0);
    const px = (x, y) => [...g.getImageData(x, y, 1, 1).data];
    return { width: bmp.width, height: bmp.height, left: px(2, 2), right: px(bmp.width - 3, bmp.height - 3) };
  }, bytes.toString("base64"));

async function saved(result) {
  expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
  const dl = await waitForDownload(result.downloadId);
  expect(dl.state, JSON.stringify(dl)).toBe("complete");
  return { dl, bytes: await readFile(dl.filename) };
}

const openWindow = async (page, url) => {
  const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes(`/${page}.html`) });
  await ctx.sw.evaluate(([page, url]) => globalThis.imgkeepOpenWindow(page, { url }), [page, url]);
  return opened;
};

const held = () => ctx.sw.evaluate(() => chrome.runtime.sendMessage({ target: "offscreen", type: "count" }));

test("Checked output: WebP saved as JPG really is a JPEG, named .jpg", async () => {
  const { dl, bytes } = await saved(await run({ url: `${cors.url}/photo.webp`, format: "jpg" }));
  expect(dl.mime).toBe("image/jpeg");
  expect(sniff(bytes)).toBe("image/jpeg");
  expect(dl.filename).toMatch(/photo\.jpg$/);
});

test("Maximum width: 2400 × 1200 becomes 1600 × 800; a smaller image keeps its size", async () => {
  await ctx.sw.evaluate(() => chrome.storage.sync.set({ maxWidth: 1600, filenameTemplate: "{name}-{w}x{h}" }));
  const big = await saved(await run({ url: wide, format: "png" }));
  expect(await decode(big.bytes)).toMatchObject({ width: 1600, height: 800 });
  expect(big.dl.filename).toMatch(/image-1600x800\.png$/);
  const small = await saved(await run({ url: `${cors.url}/photo.png`, format: "webp" }));
  expect(await decode(small.bytes)).toMatchObject({ width: 320, height: 200 });
  // PDF and GIF follow the setting too; Original format never changes.
  const pdf = await saved(await run({ url: wide, format: "pdf" }));
  expect(pdf.bytes.toString("latin1")).toMatch(/\/Width 1600 \/Height 800/);
  const original = await saved(await run({ url: `${cors.url}/wide.webp`, format: "original" }));
  expect(original.bytes.equals(await readFile(new URL("./fixtures/wide.webp", import.meta.url)))).toBe(true);
});

test("Transparency: kept in PNG and WebP, JPG gets the chosen background", async () => {
  await ctx.sw.evaluate(() => chrome.storage.sync.set({ maxWidth: 600, jpgBackground: "#ff0000" }));
  for (const format of ["png", "webp"]) {
    const img = await decode((await saved(await run({ url: wide, format }))).bytes);
    expect(img.left[3]).toBe(0);
    expect(img.right[3]).toBe(255);
  }
  const jpg = await decode((await saved(await run({ url: wide, format: "jpg" }))).bytes);
  expect(jpg.left[0]).toBeGreaterThan(240);
  expect(jpg.left[1]).toBeLessThan(15);
  // More options can pick another background for one save.
  const green = await decode((await saved(await run({ url: wide, format: "jpg", options: { background: "#00ff00" } }))).bytes);
  expect(green.left[1]).toBeGreaterThan(240);
  expect(green.left[0]).toBeLessThan(15);
});

test("Size cap (pipeline only for now): at or under the cap, or a clear failure without a file", async () => {
  const fits = await saved(await run({ url: wide, format: "jpg", options: { maxBytes: 200_000 } }));
  expect(fits.bytes.length).toBeLessThanOrEqual(200_000);
  expect(sniff(fits.bytes)).toBe("image/jpeg");
  const before = await downloadCount();
  const result = await run({ url: noise, format: "jpg", options: { maxBytes: 20_000 } }, { interactive: false });
  expect(result).toMatchObject({ ok: false, code: "size-unreachable" });
  expect(Number(result.detailSubs[0])).toBeGreaterThan(20_000); // the smallest size reached
  expect(await downloadCount()).toBe(before);
});

test("Errors: missing, corrupt and empty sources never create a file", async () => {
  const before = await downloadCount();
  const cases = [
    [`${cors.url}/missing.png`, "http"],
    ["data:image/png;base64,AAAAAAAAAAAAAAAA", "decode"],
    ["data:image/png;base64,", "decode"],
  ];
  for (const [url, code] of cases) {
    expect(await run({ url, format: "png" }, { interactive: false })).toMatchObject({ ok: false, code });
  }
  expect(await downloadCount()).toBe(before);
});

test("Error window offers Try again and Open image", async () => {
  const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/ask.html") });
  await run({ url: `${cors.url}/missing.png`, format: "png" });
  const ask = await opened;
  await expect(ask.getByRole("button", { name: "Try again" })).toBeVisible();
  const tab = ctx.context.waitForEvent("page", { predicate: (p) => p.url().endsWith("/missing.png") });
  await ask.getByRole("button", { name: "Open image" }).click();
  await (await tab).close();
  await ask.close();
});

test("Copy as PNG puts a PNG on the clipboard, without a download", async () => {
  const before = await downloadCount();
  const win = await openWindow("copy", `${cors.url}/photo.webp`);
  const closed = win.waitForEvent("close", { timeout: 10_000 });
  await expect(win.locator("#status")).toHaveText("Copied as PNG. Paste it anywhere.");
  await closed;
  await blank.bringToFront();
  const pasted = await blank.evaluate(async () => {
    const [item] = await navigator.clipboard.read();
    const blob = await item.getType("image/png");
    const bmp = await createImageBitmap(blob);
    return { types: item.types, width: bmp.width, height: bmp.height };
  });
  expect(pasted).toEqual({ types: ["image/png"], width: 320, height: 200 });
  expect(await downloadCount()).toBe(before);
  expect(await held()).toMatchObject({ pending: 0, sources: 0 });
});

test("Copy as PNG: a refused clipboard explains, keeps the clipboard, and offers a PNG download", async () => {
  await blank.evaluate(() => navigator.clipboard.writeText("keep me"));
  await ctx.sw.evaluate(() => chrome.storage.local.set({ failClipboard: true }));
  const win = await openWindow("copy", `${cors.url}/photo.webp`);
  await expect(win.locator("#title")).toHaveText("Couldn't copy the image");
  await expect(win.getByText("Your clipboard wasn't changed.", { exact: false })).toBeVisible();
  expect(await blank.evaluate(() => navigator.clipboard.readText())).toBe("keep me");
  await win.getByRole("button", { name: "Save as PNG instead" }).click();
  await expect(win.locator("#status")).toHaveText("Saved as photo.png");
  const [item] = await ctx.sw.evaluate(() => chrome.downloads.search({ filenameRegex: "photo\\.png$", orderBy: ["-startTime"] }));
  const dl = await waitForDownload(item.id);
  expect(sniff(await readFile(dl.filename))).toBe("image/png");
});

test("Copy as PNG from a site that blocks it asks for that site", async () => {
  const win = await openWindow("copy", `${plain.url}/photo.webp`);
  await expect(win.locator("#title")).toHaveText("Allow images from this site?");
  await expect(win.getByRole("button", { name: "Allow and copy" })).toBeVisible();
  await win.close();
});

test("More options: real preview, then Save with the chosen format, width and name", async () => {
  const win = await openWindow("editor", wide);
  await expect(win.locator("#sourceFacts")).toHaveText("2,400 × 1,200");
  await expect(win.locator("#resultFacts")).toContainText("2,400 × 1,200 · PNG");
  await expect(win.locator("#qualityField")).toBeHidden(); // no lossy quality for PNG
  await win.getByText("JPG", { exact: true }).click();
  await expect(win.locator("#qualityField")).toBeVisible();
  await win.getByLabel("Maximum width").fill("1600");
  await expect(win.locator("#resultFacts")).toContainText("1,600 × 800 · JPG ·");
  await expect(win.locator("#resultFacts")).toContainText("kB");
  await expect(win.locator("#ext")).toHaveText(".jpg");
  // The shown size is the real encoded size.
  const shown = await win.locator("#preview").evaluate((img) => fetch(img.src).then((r) => r.blob()).then((b) => b.size));
  await win.getByLabel("File name").fill("banner");
  await win.getByRole("button", { name: "Save" }).click();
  await expect(win.locator("#status")).toHaveText("Saved as banner.jpg");
  const [item] = await ctx.sw.evaluate(() => chrome.downloads.search({ filenameRegex: "banner\\.jpg$", orderBy: ["-startTime"] }));
  const dl = await waitForDownload(item.id);
  const bytes = await readFile(dl.filename);
  expect(sniff(bytes)).toBe("image/jpeg");
  expect(bytes.length).toBe(shown);
  expect(await decode(bytes)).toMatchObject({ width: 1600, height: 800 });
  // Closing the window drops its image.
  await win.close();
  await expect.poll(held).toMatchObject({ pending: 0, sources: 0 });
});

test("More options: Copy as PNG uses the chosen width", async () => {
  const win = await openWindow("editor", wide);
  await win.getByLabel("Maximum width").fill("300");
  await expect(win.locator("#resultFacts")).toContainText("300 × 150");
  await win.getByRole("button", { name: "Copy as PNG" }).click();
  await expect(win.locator("#status")).toHaveText("Copied as PNG. Paste it anywhere.");
  await blank.bringToFront();
  const size = await blank.evaluate(async () => {
    const [item] = await navigator.clipboard.read();
    const bmp = await createImageBitmap(await item.getType("image/png"));
    return [bmp.width, bmp.height];
  });
  expect(size).toEqual([300, 150]);
  await win.close();
});

test("More options: a broken image shows the problem and a way out", async () => {
  const win = await openWindow("editor", "data:image/png;base64,AAAAAAAAAAAAAAAA");
  await expect(win.locator("#problem")).toContainText("Couldn't save this image");
  await expect(win.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(win.getByRole("button", { name: "Save" })).toBeDisabled();
  await win.close();
});

test("A window whose job is gone says so", async () => {
  const page = await ctx.context.newPage();
  await page.goto(`chrome-extension://${ctx.extensionId}/editor.html?job=nope`);
  await expect(page.locator("#problem")).toContainText("This save has expired");
  await page.close();
});

test("Concurrent saves keep their own source, format and name", async () => {
  await ctx.sw.evaluate(() => chrome.storage.sync.set({ filenameTemplate: "{name}-{w}" }));
  const jobs = [
    { url: `${cors.url}/photo.webp`, format: "jpg", expect: ["photo-320.jpg", "image/jpeg"] },
    { url: `${cors.url}/photo.png`, format: "webp", expect: ["photo-320.webp", "image/webp"] },
    { url: wide, format: "png", options: { maxWidth: 500 }, expect: ["image-500.png", "image/png"] },
    { url: `${cors.url}/photo.avif`, format: "png", expect: ["photo-320.png", "image/png"] },
  ];
  const results = await Promise.all(jobs.map(({ expect: _, ...input }) => run(input)));
  for (const [i, result] of results.entries()) {
    const { dl, bytes } = await saved(result);
    expect(dl.filename.endsWith(jobs[i].expect[0]), dl.filename).toBe(true);
    expect(sniff(bytes)).toBe(jobs[i].expect[1]);
  }
  // Nothing is left behind once the downloads finish.
  await expect.poll(held).toMatchObject({ pending: 0, sources: 0 });
});

test("Windows only answer about their own job: no URLs, no unknown formats", async () => {
  const win = await openWindow("editor", `${cors.url}/photo.png`);
  await expect(win.locator("#resultFacts")).toContainText("320 × 200");
  const answers = await win.evaluate(async (job) => {
    const send = (m) => chrome.runtime.sendMessage({ target: "background", ...m });
    return [
      await send({ type: "preview", jobId: job, format: "gif" }),
      await send({ type: "preview", jobId: "someone-else", format: "png" }),
      await send({ type: "imgkeepRunJob", jobId: job }),
    ];
  }, new URL(win.url()).searchParams.get("job"));
  expect(answers[0]).toMatchObject({ ok: false, code: "unknown" });
  expect(answers[1]).toMatchObject({ ok: false, code: "expired" });
  expect(answers[2]).toBeUndefined();
  await win.close();
});
