// End-to-end tests: the real extension in Chromium, saving images from local servers.
import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { join, relative, sep, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { rm } from "node:fs/promises";
import { launchWithExtension } from "./launch.mjs";
import { startServer } from "./servers.mjs";

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

let ctx, cors, plain, blank;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  [cors, plain] = await Promise.all([startServer({ cors: true }), startServer({ cors: false })]);
  ctx = await launchWithExtension();
  blank = await ctx.context.newPage();
});

test.afterAll(async () => {
  await ctx?.context.close();
  await Promise.all([cors?.close(), plain?.close()]);
  if (ctx) await rm(ctx.userDataDir, { recursive: true, force: true });
});

test.afterEach(async () => {
  await ctx.sw.evaluate(() => chrome.storage.sync.clear());
});

const run = (url, format) => ctx.sw.evaluate(({ url, format }) => globalThis.imgkeepRunJob({ url, format }), { url, format });

// Waits until Chrome finishes the download and returns its record.
const waitForDownload = (id) =>
  ctx.sw.evaluate(async (id) => {
    for (let i = 0; i < 300; i++) {
      const [d] = await chrome.downloads.search({ id });
      if (d && d.state !== "in_progress") return { state: d.state, filename: d.filename, mime: d.mime, error: d.error };
      await new Promise((r) => setTimeout(r, 100));
    }
    return { state: "timeout" };
  }, id);

function sniff(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") return "webp";
  return "unknown";
}

// Decodes a file in the browser: size plus the corner and centre pixels.
const decode = (bytes) =>
  blank.evaluate(async (b64) => {
    const bin = atob(b64);
    const arr = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const bmp = await createImageBitmap(new Blob([arr]));
    const c = new OffscreenCanvas(bmp.width, bmp.height);
    const g = c.getContext("2d");
    g.drawImage(bmp, 0, 0);
    const px = (x, y) => [...g.getImageData(x, y, 1, 1).data];
    return { width: bmp.width, height: bmp.height, corner: px(2, 2), center: px(bmp.width / 2, bmp.height / 2) };
  }, bytes.toString("base64"));

async function saveAndCheck(url, format) {
  const result = await run(url, format);
  expect(result, JSON.stringify(result)).toMatchObject({ ok: true, mode: "downloads" });
  const dl = await waitForDownload(result.downloadId);
  expect(dl.state, JSON.stringify(dl)).toBe("complete");
  const bytes = await readFile(dl.filename);
  return { result, dl, bytes, rel: relative(ctx.downloadsDir, dl.filename).split(sep).join("/") };
}

const MIME = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

async function expectImage({ dl, bytes }, format) {
  expect(dl.mime).toBe(MIME[format]);
  expect(sniff(bytes)).toBe(format);
  const img = await decode(bytes);
  expect([img.width, img.height]).toEqual([320, 200]);
  return img;
}

// Centre of the fixture is the yellow circle (#f2b134).
function expectYellow([r, g, b, a]) {
  expect(Math.abs(r - 0xf2)).toBeLessThan(12);
  expect(Math.abs(g - 0xb1)).toBeLessThan(12);
  expect(Math.abs(b - 0x34)).toBeLessThan(16);
  expect(a).toBe(255);
}

test("WebP → PNG keeps transparency", async () => {
  const out = await saveAndCheck(`${cors.url}/photo.webp`, "png");
  expect(out.rel).toBe("photo.png");
  const img = await expectImage(out, "png");
  expect(img.corner[3]).toBe(0);
  expectYellow(img.center);
});

test("PNG → JPG fills transparent corners with white", async () => {
  const out = await saveAndCheck(`${cors.url}/photo.png`, "jpg");
  expect(out.rel).toBe("photo.jpg");
  const img = await expectImage(out, "jpg");
  for (const v of img.corner.slice(0, 3)) expect(v).toBeGreaterThanOrEqual(250);
  expectYellow(img.center);
});

test("JPG → WebP", async () => {
  const out = await saveAndCheck(`${cors.url}/photo.jpg`, "webp");
  expect(out.rel).toBe("photo.webp");
  const img = await expectImage(out, "webp");
  expectYellow(img.center);
});

test("AVIF → PNG", async () => {
  const out = await saveAndCheck(`${cors.url}/photo.avif`, "png");
  const img = await expectImage(out, "png");
  expectYellow(img.center);
});

test("SVG → PNG", async () => {
  const out = await saveAndCheck(`${cors.url}/photo.svg`, "png");
  const img = await expectImage(out, "png");
  expect(img.corner[3]).toBe(0);
  expectYellow(img.center);
});

test("Original format downloads the file untouched", async () => {
  const out = await saveAndCheck(`${cors.url}/photo.webp`, "original");
  expect(out.rel).toMatch(/^photo( \(\d+\))?\.webp$/);
  expect(out.dl.mime).toBe("image/webp");
  expect(out.bytes.equals(await readFile(join(FIXTURES, "photo.webp")))).toBe(true);
});

test("Subfolder and name template", async () => {
  await ctx.sw.evaluate(() => chrome.storage.sync.set({ subfolder: "Imgkeep/{host}", filenameTemplate: "{name}-{w}x{h}" }));
  const out = await saveAndCheck(`${cors.url}/photo.png`, "png");
  expect(out.rel).toBe("Imgkeep/127.0.0.1/photo-320x200.png");
  await expectImage(out, "png");
});

test("Never overwrites: a second save gets a new name", async () => {
  await ctx.sw.evaluate(() => chrome.storage.sync.set({ subfolder: "twice" }));
  const first = await saveAndCheck(`${cors.url}/photo.png`, "webp");
  const second = await saveAndCheck(`${cors.url}/photo.png`, "webp");
  expect(first.rel).toBe("twice/photo.webp");
  expect(second.rel).not.toBe(first.rel);
});

test("data: URL input is named image", async () => {
  const png = (await readFile(join(FIXTURES, "photo.png"))).toString("base64");
  await ctx.sw.evaluate(() => chrome.storage.sync.set({ subfolder: "data" }));
  const out = await saveAndCheck(`data:image/png;base64,${png}`, "jpg");
  expect(out.rel).toBe("data/image.jpg");
  await expectImage(out, "jpg");
});

test("Large output goes through a blob: URL", async () => {
  const out = await saveAndCheck(`${cors.url}/big.png`, "png");
  expect(out.bytes.length).toBeGreaterThan(1.5 * 1024 * 1024);
  expect(sniff(out.bytes)).toBe("png");
  const img = await decode(out.bytes);
  expect([img.width, img.height]).toEqual([1100, 1100]);
});

test("A site without CORS opens the ask window with reason host", async () => {
  const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/ask.html") });
  const result = await run(`${plain.url}/photo.webp`, "png");
  expect(result).toMatchObject({ ok: false, reason: "host", origin: "http://127.0.0.1/*" });
  const ask = await opened;
  const job = await ctx.sw.evaluate((key) => chrome.storage.session.get(key).then((s) => s[key]), `job:${result.jobId}`);
  expect(job.reason).toBe("host");
  await expect(ask.locator("#title")).toHaveText("Allow images from this site?");
  await expect(ask.getByRole("button", { name: "Allow and save" })).toBeVisible();
  await expect(ask.getByRole("button", { name: "Save original format instead" })).toBeVisible();
  await ask.close();
});

test("Ask window: Save original format instead, then it closes itself", async () => {
  const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/ask.html") });
  await ctx.sw.evaluate(() => chrome.storage.sync.set({ subfolder: "from-ask" }));
  const result = await run(`${plain.url}/photo.webp`, "jpg");
  const ask = await opened;
  const closed = ask.waitForEvent("close", { timeout: 5000 });
  await ask.getByRole("button", { name: "Save original format instead" }).click();
  await expect(ask.locator("#status")).toHaveText("Saved as from-ask/photo.webp");
  await closed;
  const [item] = await ctx.sw.evaluate(() => chrome.downloads.search({ filenameRegex: "from-ask", orderBy: ["-startTime"] }));
  const dl = await waitForDownload(item.id);
  expect(dl.state).toBe("complete");
  expect((await readFile(dl.filename)).equals(await readFile(join(FIXTURES, "photo.webp")))).toBe(true);
  // The job is removed from session storage.
  const left = await ctx.sw.evaluate((key) => chrome.storage.session.get(key), `job:${result.jobId}`);
  expect(left).toEqual({});
});

test("An HTTP error opens the ask window with a plain message", async () => {
  const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/ask.html") });
  const result = await run(`${cors.url}/missing.png`, "png");
  expect(result).toMatchObject({ ok: false, reason: "error", code: "http", detail: "404" });
  const ask = await opened;
  await expect(ask.locator("#title")).toHaveText("Couldn't save this image");
  await expect(ask.getByText("HTTP 404")).toBeVisible();
  await ask.close();
});

test("Folder mode with no folder chosen asks for one", async () => {
  await ctx.sw.evaluate(() => chrome.storage.sync.set({ saveMode: "folder" }));
  const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/ask.html") });
  const result = await run(`${cors.url}/photo.png`, "png");
  expect(result).toMatchObject({ ok: false, reason: "no-folder" });
  const ask = await opened;
  await expect(ask.locator("#title")).toHaveText("Choose a folder");
  await expect(ask.getByText("Allow on every visit")).toBeVisible();
  await ask.close();
});

// The real picker can't be automated. A folder from the extension's private file system
// is a genuine FileSystemDirectoryHandle, so the same write path runs.
test("Folder mode writes into subfolders and never overwrites", async () => {
  const page = await ctx.context.newPage();
  await page.goto(`chrome-extension://${ctx.extensionId}/options.html`);
  await page.evaluate(async () => {
    const { setFolder } = await import("./lib/folder.js");
    const root = await navigator.storage.getDirectory();
    await setFolder(await root.getDirectoryHandle("picked", { create: true }));
  });
  await page.reload();
  await expect(page.locator("#folderStatus")).toHaveText("“picked” — connected");
  await ctx.sw.evaluate(() => chrome.storage.sync.set({ saveMode: "folder", subfolder: "Imgkeep/{host}" }));
  const first = await run(`${cors.url}/photo.webp`, "png");
  const second = await run(`${cors.url}/photo.webp`, "png");
  expect(first).toMatchObject({ ok: true, mode: "folder", path: "Imgkeep/127.0.0.1/photo.png" });
  expect(second).toMatchObject({ ok: true, mode: "folder", path: "Imgkeep/127.0.0.1/photo (2).png" });
  const b64 = await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    let dir = await root.getDirectoryHandle("picked");
    for (const d of ["Imgkeep", "127.0.0.1"]) dir = await dir.getDirectoryHandle(d);
    const file = await (await dir.getFileHandle("photo.png")).getFile();
    const bytes = new Uint8Array(await file.arrayBuffer());
    return btoa(String.fromCharCode(...bytes));
  });
  const bytes = Buffer.from(b64, "base64");
  expect(sniff(bytes)).toBe("png");
  const img = await decode(bytes);
  expect([img.width, img.height]).toEqual([320, 200]);
  expect(img.corner[3]).toBe(0);
  await page.evaluate(async () => {
    const { clearFolder } = await import("./lib/folder.js");
    await clearFolder();
  });
  await page.close();
});

test("Options page loads without errors and shows the four permissions", async () => {
  const page = await ctx.context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(`chrome-extension://${ctx.extensionId}/options.html`);
  await expect(page.locator("#preview")).toHaveText("summer-banner.png");
  await page.fill("#subfolder", "Imgkeep/{host}");
  await page.fill("#filenameTemplate", "{name}-{w}x{h}");
  await expect(page.locator("#preview")).toHaveText("Imgkeep/shop.example.com/summer-banner-1600x900.png");
  await expect(page.locator(".tag")).toHaveText(["contextMenus", "downloads", "storage", "offscreen"]);
  await expect(page.locator("#waitlist")).toBeHidden();
  await expect(page.locator("#version")).toHaveText("0.3.0");
  const saved = await ctx.sw.evaluate(() => chrome.storage.sync.get(["subfolder", "filenameTemplate"]));
  expect(saved).toEqual({ subfolder: "Imgkeep/{host}", filenameTemplate: "{name}-{w}x{h}" });
  expect(errors).toEqual([]);
  await page.close();
});

test("Context menu is registered for images", async () => {
  // contextMenus has no getter; recreating the parent id must fail because it already exists.
  const err = await ctx.sw.evaluate(
    () => new Promise((r) => chrome.contextMenus.create({ id: "imgkeep", title: "x", contexts: ["image"] }, () => r(chrome.runtime.lastError?.message || ""))),
  );
  expect(err).toMatch(/duplicate|exists/i);
});
