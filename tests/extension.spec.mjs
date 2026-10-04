// End-to-end tests: the real extension in Chromium, saving images from local servers.
import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";
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
  // A local http page is a secure context, which ImageDecoder (used to read GIFs back) needs.
  await blank.goto(`${cors.url}/photo.svg`);
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
  await expect(page.getByRole("link", { name: "Get notified" })).toHaveAttribute("href", "https://imgkeep.app/pro.html");
  const { version } = JSON.parse(await readFile(join(dirname(FIXTURES), "..", "extension", "manifest.json"), "utf8"));
  await expect(page.locator("#version")).toHaveText(version);
  const saved = await ctx.sw.evaluate(() => chrome.storage.sync.get(["subfolder", "filenameTemplate"]));
  expect(saved).toEqual({ subfolder: "Imgkeep/{host}", filenameTemplate: "{name}-{w}x{h}" });
  expect(errors).toEqual([]);
  await page.close();
});

// Reads a GIF back with ImageDecoder: frame count, size, each frame's duration and top-left pixel.
const gifInfo = (bytes) =>
  blank.evaluate(async (b64) => {
    const data = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const decoder = new ImageDecoder({ data, type: "image/gif" });
    await decoder.tracks.ready;
    await decoder.completed;
    const frames = [];
    for (let i = 0; i < decoder.tracks.selectedTrack.frameCount; i++) {
      const { image } = await decoder.decode({ frameIndex: i });
      const c = new OffscreenCanvas(image.displayWidth, image.displayHeight);
      const g = c.getContext("2d");
      g.drawImage(image, 0, 0);
      const px = (x, y) => [...g.getImageData(x, y, 1, 1).data];
      frames.push({ ms: image.duration / 1000, corner: px(2, 2), center: px(image.displayWidth / 2, image.displayHeight / 2) });
      image.close();
    }
    return { frames };
  }, bytes.toString("base64"));

async function saveGif(file) {
  const out = await saveAndCheck(`${cors.url}/${file}`, "gif");
  expect(out.dl.mime).toBe("image/gif");
  expect(out.bytes.subarray(0, 6).toString()).toBe("GIF89a");
  const img = await decode(out.bytes);
  return { ...out, size: [img.width, img.height], info: await gifInfo(out.bytes) };
}

test("GIF: an animated GIF is saved byte for byte", async () => {
  const out = await saveAndCheck(`${cors.url}/animated.gif`, "gif");
  expect(out.rel).toBe("animated.gif");
  expect(out.dl.mime).toBe("image/gif");
  expect(out.bytes.equals(await readFile(join(FIXTURES, "animated.gif")))).toBe(true);
});

test("GIF: an animated WebP keeps its frames, timing and transparency", async () => {
  const out = await saveGif("animated.webp");
  expect(out.rel).toMatch(/^animated( \(\d+\))?\.gif$/); // the GIF test before saved animated.gif
  expect(out.size).toEqual([64, 48]);
  expect(out.info.frames.map((f) => f.ms)).toEqual([100, 200, 300]);
  // Only the second frame has a transparent corner; the others stay opaque (no black box, no bleed-through).
  expect(out.info.frames.map((f) => f.corner[3])).toEqual([255, 0, 255]);
  // Frame 1 is red; its moving white square is elsewhere.
  const [r, g, b] = out.info.frames[0].corner;
  expect(r).toBeGreaterThan(200);
  expect(g).toBeLessThan(80);
  expect(b).toBeLessThan(80);
});

test("GIF: a still image becomes a valid one-frame GIF, transparency kept", async () => {
  const out = await saveGif("photo.png");
  expect(out.rel).toBe("photo.gif");
  expect(out.size).toEqual([320, 200]);
  expect(out.info.frames).toHaveLength(1);
  expect(out.info.frames[0].corner[3]).toBe(0);
  const [r, g, b, a] = out.info.frames[0].center;
  expect([Math.abs(r - 0xf2) < 20, Math.abs(g - 0xb1) < 20, Math.abs(b - 0x34) < 24, a]).toEqual([true, true, true, 255]);
});

test("GIF: wide animations are scaled down to 800px, keeping their shape", async () => {
  const out = await saveGif("wide.webp");
  expect(out.size).toEqual([800, 80]);
  expect(out.info.frames).toHaveLength(2);
});

test("GIF: an animation over the frame limit stops with too-large and explains why", async () => {
  const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/ask.html") });
  const result = await run(`${cors.url}/many-frames.webp`, "gif");
  expect(result).toMatchObject({ ok: false, reason: "error", code: "too-large" });
  expect(result).toMatchObject({ detail: "@detailGifFrames", detailSubs: ["601", "600"] }); // translated in the ask window
  const ask = await opened;
  await expect(ask.locator("#title")).toHaveText("Couldn't save this image");
  await expect(ask.getByText("601 frames")).toBeVisible();
  await ask.close();
});

// Reads back a one-page image PDF: checks the structure and returns the page size and image streams.
function readPdf(buf) {
  const text = buf.toString("latin1");
  expect(text.startsWith("%PDF-1.")).toBe(true);
  const startxref = Number(/startxref\n(\d+)\n%%EOF\n?$/.exec(text)[1]);
  expect(text.slice(startxref, startxref + 4)).toBe("xref");
  const [, first, count] = /^xref\n(\d+) (\d+)\n/.exec(text.slice(startxref));
  const table = text.slice(startxref).split("\n").slice(2, 2 + Number(count));
  const objects = {};
  table.forEach((line, i) => {
    const n = Number(first) + i;
    if (n === 0) return;
    const offset = Number(line.slice(0, 10));
    expect(text.slice(offset).startsWith(`${n} 0 obj`), `object ${n} offset`).toBe(true);
    objects[n] = offset;
  });
  const object = (n) => {
    const start = objects[n];
    const dictEnd = text.indexOf("\nstream\n", start);
    const end = text.indexOf("endobj", start);
    const head = text.slice(start, dictEnd > 0 && dictEnd < end ? dictEnd : end);
    if (!(dictEnd > 0 && dictEnd < end)) return { head };
    const length = Number(/\/Length (\d+)/.exec(head)[1]);
    const from = dictEnd + "\nstream\n".length;
    return { head, stream: buf.subarray(from, from + length) };
  };
  const box = /\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/.exec(object(3).head);
  const img = object(4);
  return {
    page: [Number(box[1]), Number(box[2])],
    head: img.head,
    image: img.stream,
    mask: / \/SMask 6 0 R/.test(img.head) ? object(6).stream : null,
  };
}

test("PDF: a transparent PNG is stored losslessly, with its transparency", async () => {
  const out = await saveAndCheck(`${cors.url}/photo.png`, "pdf");
  expect(out.rel).toBe("photo.pdf");
  expect(out.dl.mime).toBe("application/pdf");
  const pdf = readPdf(out.bytes);
  expect(pdf.page).toEqual([320, 200]);
  expect(pdf.head).toContain("/Width 320 /Height 200");
  expect(pdf.head).toContain("/FlateDecode");
  const rgb = inflateSync(pdf.image);
  const alpha = inflateSync(pdf.mask);
  expect(rgb.length).toBe(320 * 200 * 3);
  expect(alpha.length).toBe(320 * 200);
  expect(alpha[2 * 320 + 2]).toBe(0); // transparent corner
  const c = (100 * 320 + 160);
  expect(alpha[c]).toBe(255);
  expect([rgb[c * 3], rgb[c * 3 + 1], rgb[c * 3 + 2]]).toEqual([0xf2, 0xb1, 0x34]); // yellow centre, exact
});

test("PDF: a photo is stored as JPEG, page size = image size", async () => {
  const out = await saveAndCheck(`${cors.url}/photo.jpg`, "pdf");
  const pdf = readPdf(out.bytes);
  expect(pdf.page).toEqual([320, 200]);
  expect(pdf.head).toContain("/DCTDecode");
  expect(pdf.mask).toBeNull();
  expect(sniff(Buffer.from(pdf.image))).toBe("jpg");
  const img = await decode(Buffer.from(pdf.image));
  expect([img.width, img.height]).toEqual([320, 200]);
  expectYellow(img.center);
});

test("PDF: data: URL input is named image.pdf", async () => {
  const png = (await readFile(join(FIXTURES, "photo.png"))).toString("base64");
  await ctx.sw.evaluate(() => chrome.storage.sync.set({ subfolder: "pdf-data" }));
  const out = await saveAndCheck(`data:image/png;base64,${png}`, "pdf");
  expect(out.rel).toBe("pdf-data/image.pdf");
  expect(out.bytes.toString("latin1")).toContain("/Title (image)");
});

test("Context menu is registered for images", async () => {
  // contextMenus has no getter; recreating the parent id must fail because it already exists.
  const err = await ctx.sw.evaluate(
    () => new Promise((r) => chrome.contextMenus.create({ id: "imgkeep", title: "x", contexts: ["image"] }, () => r(chrome.runtime.lastError?.message || ""))),
  );
  expect(err).toMatch(/duplicate|exists/i);
  const gifErr = await ctx.sw.evaluate(
    () => new Promise((r) => chrome.contextMenus.create({ id: "imgkeep-gif", title: "x", contexts: ["image"] }, () => r(chrome.runtime.lastError?.message || ""))),
  );
  expect(gifErr).toMatch(/duplicate|exists/i);
  const pdfErr = await ctx.sw.evaluate(
    () => new Promise((r) => chrome.contextMenus.create({ id: "imgkeep-pdf", title: "x", contexts: ["image"] }, () => r(chrome.runtime.lastError?.message || ""))),
  );
  expect(pdfErr).toMatch(/duplicate|exists/i);
});
