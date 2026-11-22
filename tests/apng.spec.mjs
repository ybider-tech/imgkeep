// 0.15.0: APNG output (animated PNG, More options) and the note that a still format keeps only the first frame.
import { test, expect } from "@playwright/test";
import { readFile, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { launchWithExtension } from "./launch.mjs";
import { startServer } from "./servers.mjs";
import { isAnimatedBytes } from "../extension/lib/image.js";
import { pngChunks } from "../extension/lib/apng.js";
import { FORMATS } from "../extension/lib/settings.js";
import { COUNT_KEYS } from "../extension/lib/telemetry.js";

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const fixture = async (f) => new Uint8Array(await readFile(join(FIXTURES, f)));

test.describe("without a browser", () => {
  test("which images move, from their bytes", async () => {
    for (const f of ["animated.gif", "animated.webp", "many-frames.webp"]) expect(isAnimatedBytes(await fixture(f)), f).toBe(true);
    for (const f of ["photo.png", "photo.jpg", "photo.webp", "photo.avif", "photo.svg"]) expect(isAnimatedBytes(await fixture(f)), f).toBe(false);
  });

  test("APNG is a More options format saved as .png, and counted like the others", () => {
    expect(FORMATS.apng).toEqual({ mime: "image/apng", ext: "png", label: "APNG", animated: true });
    expect(COUNT_KEYS).toEqual(expect.arrayContaining(["save_apng", "webp_to_apng", "gif_to_apng"]));
  });
});

test.describe("in the extension", () => {
  let ctx, cors, blank;
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    cors = await startServer({ cors: true });
    ctx = await launchWithExtension();
    blank = await ctx.context.newPage();
    await blank.goto(`${cors.url}/photo.svg`); // a secure context, for ImageDecoder
  });

  test.afterAll(async () => {
    await ctx?.context.close();
    await cors?.close();
    if (ctx) await rm(ctx.userDataDir, { recursive: true, force: true });
  });

  const save = async (file) => {
    const result = await ctx.sw.evaluate((url) => globalThis.imgkeepRunJob({ url, format: "apng" }, { interactive: false }), `${cors.url}/${file}`);
    expect(result, JSON.stringify(result)).toMatchObject({ ok: true, mode: "downloads" });
    const dl = await ctx.sw.evaluate(async (id) => {
      for (let i = 0; i < 300; i++) {
        const [d] = await chrome.downloads.search({ id });
        if (d && d.state !== "in_progress") return d;
        await new Promise((r) => setTimeout(r, 100));
      }
    }, result.downloadId);
    return { name: dl.filename.split(/[\\/]/).pop(), bytes: new Uint8Array(await readFile(dl.filename)) };
  };

  // How the browser itself plays the file: frame count and each frame's duration.
  const play = (bytes) =>
    blank.evaluate(async (b64) => {
      const data = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const d = new ImageDecoder({ data, type: "image/png" });
      await d.tracks.ready;
      await d.completed;
      const frames = [];
      for (let i = 0; i < d.tracks.selectedTrack.frameCount; i++) {
        const { image } = await d.decode({ frameIndex: i });
        const c = new OffscreenCanvas(image.displayWidth, image.displayHeight);
        c.getContext("2d").drawImage(image, 0, 0);
        frames.push({ ms: image.duration / 1000, corner: [...c.getContext("2d").getImageData(2, 2, 1, 1).data], size: [image.displayWidth, image.displayHeight] });
        image.close();
      }
      return { animated: d.tracks.selectedTrack.animated, frames };
    }, Buffer.from(bytes).toString("base64"));

  test("an animated WebP becomes an APNG that plays every frame, with its timing and transparency", async () => {
    const out = await save("animated.webp");
    expect(out.name).toBe("animated.png");
    const types = pngChunks(out.bytes).map((c) => c.type);
    expect(types.slice(0, 3)).toEqual(["IHDR", "acTL", "fcTL"]);
    expect(types.filter((t) => t === "fcTL")).toHaveLength(3);
    const played = await play(out.bytes);
    expect(played.animated).toBe(true);
    expect(played.frames.map((f) => f.ms)).toEqual([100, 200, 300]);
    expect(played.frames.map((f) => f.size)).toEqual([[64, 48], [64, 48], [64, 48]]);
    expect(played.frames.map((f) => f.corner[3])).toEqual([255, 0, 255]); // full alpha, unlike GIF's on/off
  });

  test("an animated GIF becomes an APNG too", async () => {
    const out = await save("animated.gif");
    expect((await play(out.bytes)).frames.length).toBeGreaterThan(1);
  });

  test("a still image saved as APNG is a plain PNG", async () => {
    const out = await save("photo.webp");
    expect(out.name).toBe("photo.png");
    expect(pngChunks(out.bytes).map((c) => c.type)).not.toContain("acTL");
  });

  test("More options: APNG is offered, and an image that moves says what a still format does to it", async () => {
    const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/editor.html") });
    await ctx.sw.evaluate((url) => globalThis.imgkeepOpenWindow("editor", { url }), `${cors.url}/animated.webp`);
    const win = await opened;
    await win.locator('label:has(input[name="format"][value="jpg"])').click();
    await expect(win.locator("#animatedHint")).toHaveText("This image moves. JPG keeps only its first frame: choose APNG to keep the motion, or GIF from the right-click menu.");
    await win.locator('label:has(input[name="format"][value="apng"])').click();
    await expect(win.locator("#animatedHint")).toBeHidden();
    await expect(win.locator("#apngHint")).toBeVisible();
    await expect(win.locator("#qualityField")).toBeHidden();
    await expect(win.locator("#resultFacts")).toContainText("APNG");
    await expect(win.locator("#ext")).toHaveText(".png");
    await win.close();
  });

  test("More options: no note for an image that doesn't move", async () => {
    const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/editor.html") });
    await ctx.sw.evaluate((url) => globalThis.imgkeepOpenWindow("editor", { url }), `${cors.url}/photo.webp`);
    const win = await opened;
    await win.locator('label:has(input[name="format"][value="jpg"])').click();
    await expect(win.locator("#resultFacts")).toContainText("JPG");
    await expect(win.locator("#animatedHint")).toBeHidden();
    await win.close();
  });
});
