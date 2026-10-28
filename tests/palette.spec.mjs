// 0.11.0: Get colour palette. Pure rules first (Node), then the real extension in Chromium.
import { test, expect } from "@playwright/test";
import { readFile, rm } from "node:fs/promises";
import { launchWithExtension } from "./launch.mjs";
import { startServer, encodePng } from "./servers.mjs";
import * as p from "../extension/lib/palette.js";

// RGBA pixels from a function of (x, y).
const pixels = (w, h, f) => {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) d.set(f(i % w, Math.floor(i / w)), i * 4);
  return d;
};

// Reads an .ase file back: [{ name, rgb: [r, g, b] }].
function parseAse(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  expect(String.fromCharCode(...bytes.subarray(0, 4))).toBe("ASEF");
  expect([v.getUint16(4), v.getUint16(6)]).toEqual([1, 0]);
  const out = [];
  let o = 12;
  for (let i = 0; i < v.getUint32(8); i++) {
    expect(v.getUint16(o)).toBe(1);
    const end = o + 6 + v.getUint32(o + 2);
    const units = v.getUint16(o + 6);
    let name = "";
    for (let j = 0; j < units - 1; j++) name += String.fromCharCode(v.getUint16(o + 8 + j * 2));
    let q = o + 8 + units * 2;
    expect(String.fromCharCode(...bytes.subarray(q, q + 4))).toBe("RGB ");
    q += 4;
    const rgb = [0, 1, 2].map((k) => Math.round(v.getFloat32(q + k * 4) * 255));
    expect(v.getUint16(q + 12)).toBe(2);
    out.push({ name, rgb });
    o = end;
  }
  expect(o).toBe(bytes.length);
  return out;
}

// Reads a .gpl file back: ["#RRGGBB", …].
function parseGpl(text) {
  const lines = text.trim().split("\n");
  expect(lines[0]).toBe("GIMP Palette");
  return lines
    .filter((l) => /^\s*\d+\s+\d+\s+\d+/.test(l))
    .map((l) => p.rgbToHex(l.trim().split(/\s+/).slice(0, 3).map(Number)));
}

test.describe("rules", () => {
  test("a solid image gives exactly its colour, with all of the share", () => {
    expect(p.extractPalette(pixels(40, 30, () => [18, 52, 86, 255]), 5)).toEqual([{ hex: "#123456", rgb: [18, 52, 86], share: 1 }]);
  });

  test("a 70/30 image gives both colours, largest first, with their shares", () => {
    const palette = p.extractPalette(pixels(100, 20, (x) => (x < 70 ? [200, 30, 30, 255] : [20, 40, 220, 255])), 8);
    expect(palette.map((c) => c.hex)).toEqual(["#C81E1E", "#1428DC"]);
    expect(Math.abs(palette[0].share - 0.7)).toBeLessThan(0.02);
    expect(Math.abs(palette[1].share - 0.3)).toBeLessThan(0.02);
  });

  test("transparent pixels are ignored, and an image with nothing visible has no colours", () => {
    expect(p.extractPalette(pixels(20, 20, (x) => (x < 15 ? [255, 0, 0, 20] : [0, 255, 0, 255])), 5)).toEqual([{ hex: "#00FF00", rgb: [0, 255, 0], share: 1 }]);
    expect(p.extractPalette(pixels(20, 20, () => [255, 0, 0, 0]), 5)).toEqual([]);
  });

  test("many colours: the requested number, distinct, shares adding up to 1, the same every time", () => {
    const img = pixels(200, 150, (x, y) => [(x * 7 + y * 3) % 256, (x * y) % 256, (x + y * 5) % 256, 255]);
    for (const n of [5, 8, 12]) {
      const a = p.extractPalette(img, n);
      expect(a).toHaveLength(n);
      expect(new Set(a.map((c) => c.hex)).size).toBe(n);
      expect(Math.abs(a.reduce((s, c) => s + c.share, 0) - 1)).toBeLessThan(1e-9);
      expect(a.map((c) => c.share)).toEqual([...a.map((c) => c.share)].sort((x, y) => y - x));
      expect(p.extractPalette(img, n)).toEqual(a);
    }
  });

  test("near-identical colours count as one", () => {
    const palette = p.extractPalette(pixels(100, 10, (x) => (x < 50 ? [100, 100, 100, 255] : [102, 101, 100, 255])), 5);
    expect(palette).toHaveLength(1);
  });

  test("colour formats and code", () => {
    expect(p.colourText("#c8a27a")).toBe("#C8A27A");
    expect(p.colourText("#C8A27A", "rgb")).toBe("rgb(200, 162, 122)");
    expect(p.colourText("#C8A27A", "hsl")).toBe("hsl(31, 41%, 63%)");
    expect(p.colourText("#FFFFFF", "hsl")).toBe("hsl(0, 0%, 100%)");
    const hexes = ["#C8A27A", "#1A2B3C"];
    expect(p.toCssVars(hexes)).toBe(":root {\n  --color-1: #C8A27A;\n  --color-2: #1A2B3C;\n}");
    expect(p.paletteCode(hexes, "css", "rgb")).toContain("--color-1: rgb(200, 162, 122);");
    expect(JSON.parse(p.paletteCode(hexes, "json"))).toEqual(hexes);
    expect(p.paletteCode(hexes, "list")).toBe("#C8A27A\n#1A2B3C");
    expect(p.paletteCode(hexes, "tailwind")).toBe('colors: {\n  palette: {\n    1: "#C8A27A",\n    2: "#1A2B3C",\n  },\n},');
    // A window may only ask to save clean colours, at most 12.
    expect(p.cleanHexes(["#c8a27a", "red", "javascript:alert(1)", 3, "#123"])).toEqual(["#C8A27A"]);
    expect(p.cleanHexes(Array(20).fill("#000000"))).toHaveLength(12);
  });

  test(".gpl and .ase files read back to the same colours", () => {
    const hexes = ["#C8A27A", "#1A2B3C", "#FFFFFF", "#000000"];
    const gpl = p.toGpl(hexes, "photo-palette");
    expect(gpl).toMatch(/^GIMP Palette\nName: photo-palette\nColumns: 4\n#\n/);
    expect(parseGpl(gpl)).toEqual(hexes);
    expect(parseAse(p.toAse(hexes))).toEqual(hexes.map((h) => ({ name: h, rgb: p.hexToRgb(h) })));
  });
});

test.describe("in the extension", () => {
  let ctx, cors, blank;
  test.describe.configure({ mode: "serial" });

  // 300 × 100: 70% teal, 30% orange.
  const twoColours = (() => {
    const w = 300, h = 100;
    const px = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px.set(x < 210 ? [15, 107, 92, 255] : [242, 140, 40, 255], (y * w + x) * 4);
    return `data:image/png;base64,${encodePng(w, h, px).toString("base64")}`;
  })();

  test.beforeAll(async () => {
    cors = await startServer({ cors: true });
    ctx = await launchWithExtension();
    blank = await ctx.context.newPage();
    await blank.goto(`${cors.url}/photo.svg`);
    await ctx.context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: cors.url });
  });

  test.afterAll(async () => {
    await ctx?.context.close();
    await cors?.close();
    if (ctx) await rm(ctx.userDataDir, { recursive: true, force: true });
  });

  test.afterEach(async () => {
    await ctx.sw.evaluate(() => Promise.all([chrome.storage.sync.clear(), chrome.storage.local.clear()]));
  });

  const opened = (name) => ctx.context.waitForEvent("page", { predicate: (pg) => pg.url().includes(`/${name}.html`) });
  const counts = () => ctx.sw.evaluate(() => chrome.storage.local.get("counts").then((s) => s.counts?.c || {}));
  const clipboard = async () => {
    await blank.bringToFront();
    return (await blank.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n"); // Windows writes CRLF
  };
  async function download(re) {
    let item;
    await expect
      .poll(async () => {
        [item] = await ctx.sw.evaluate((re) => chrome.downloads.search({ filenameRegex: re, orderBy: ["-startTime"], state: "complete" }), re);
        return Boolean(item);
      })
      .toBe(true);
    return item;
  }

  test("the menu is called Imgkeep and has Get colour palette, marked New after an update", async () => {
    expect(await ctx.sw.evaluate(() => chrome.i18n.getMessage("menuParent"))).toBe("Imgkeep");
    expect(await ctx.sw.evaluate(() => globalThis.imgkeepMenuTitles.get("imgkeep-palette"))).toBe("Get colour palette");
    await ctx.sw.evaluate(() => globalThis.imgkeepOnInstalled({ reason: "update", previousVersion: "0.10.2" }));
    expect(await ctx.sw.evaluate(() => globalThis.imgkeepMenuTitles.get("imgkeep-palette"))).toBe("Get colour palette ✨ New");
    await ctx.sw.evaluate(() => chrome.storage.local.remove("menuNew").then(() => globalThis.imgkeepRefreshMenus()));
  });

  test("from the menu: the colours, click one to copy it, switch count and format, copy all as code", async () => {
    const win = opened("palette");
    await ctx.sw.evaluate((url) => globalThis.imgkeepMenuClicked({ menuItemId: "imgkeep-palette", srcUrl: url, pageUrl: "" }), twoColours);
    const page = await win;
    const swatches = page.locator(".swatch");
    await expect(swatches).toHaveCount(2);
    await expect(swatches.first()).toHaveAttribute("aria-label", "Copy #0F6B5C (70% of the image)");
    await expect(page.locator("#thumb")).toBeVisible();

    await swatches.nth(1).click();
    await expect(page.locator("#status")).toHaveText("Copied #F28C28");
    expect(await clipboard()).toBe("#F28C28");

    await page.bringToFront();
    await page.getByText("RGB", { exact: true }).click();
    await expect(swatches.first()).toContainText("rgb(15, 107, 92)");
    await page.getByRole("button", { name: "CSS variables" }).click();
    await expect(page.locator("#status")).toHaveText("Copied all colours as CSS variables");
    expect(await clipboard()).toBe(":root {\n  --color-1: rgb(15, 107, 92);\n  --color-2: rgb(242, 140, 40);\n}");

    // The choices are remembered for the next palette.
    expect(await ctx.sw.evaluate(() => chrome.storage.local.get(["lastPaletteCount", "lastPaletteFormat"]))).toEqual({ lastPaletteCount: "5", lastPaletteFormat: "rgb" });
    expect(await counts()).toMatchObject({ palette_open: 1, palette_copy_one: 1, palette_copy_all: 1 });
    await page.close();
  });

  test("save as PNG swatches, GIMP palette and Adobe swatches, named after the image", async () => {
    const win = opened("palette");
    await ctx.sw.evaluate((url) => globalThis.imgkeepOpenWindow("palette", { url }), `${cors.url}/photo.png`);
    const page = await win;
    await expect(page.locator(".swatch")).not.toHaveCount(0);
    const hexes = await page.locator(".swatch .value").allTextContents();

    await page.getByRole("button", { name: "GIMP palette" }).click();
    await expect(page.locator("#status")).toHaveText("Saved as photo-palette.gpl");
    expect(parseGpl(await readFile((await download("photo-palette\\.gpl$")).filename, "utf8"))).toEqual(hexes);

    await page.getByRole("button", { name: "Adobe swatches" }).click();
    await expect(page.locator("#status")).toHaveText("Saved as photo-palette.ase");
    expect(parseAse(new Uint8Array(await readFile((await download("photo-palette\\.ase$")).filename))).map((c) => c.name)).toEqual(hexes);

    await page.getByRole("button", { name: "PNG swatches" }).click();
    await expect(page.locator("#status")).toHaveText("Saved as photo-palette.png");
    const png = await readFile((await download("photo-palette\\.png$")).filename);
    const strip = await blank.evaluate(async ([b64, n]) => {
      const bmp = await createImageBitmap(new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))]));
      const c = new OffscreenCanvas(bmp.width, bmp.height);
      c.getContext("2d").drawImage(bmp, 0, 0);
      const px = (x) => [...c.getContext("2d").getImageData(x, 150, 1, 1).data.slice(0, 3)];
      return { width: bmp.width, height: bmp.height, first: px(600 / n), last: px(1200 - 600 / n) };
    }, [png.toString("base64"), hexes.length]);
    expect(strip).toMatchObject({ width: 1200, height: 380, first: p.hexToRgb(hexes[0]), last: p.hexToRgb(hexes.at(-1)) });

    expect(await counts()).toMatchObject({ palette_save_gpl: 1, palette_save_ase: 1, palette_save_png: 1 });
    await page.close();
  });

  test("More options → Get colour palette, also for an image Find image here found", async () => {
    const editorWin = opened("editor");
    await ctx.sw.evaluate((url) => globalThis.imgkeepOpenWindow("editor", { url, via: "find" }), twoColours);
    const editor = await editorWin;
    await expect(editor.locator("#save")).toBeEnabled();
    const win = opened("palette");
    await editor.getByRole("button", { name: "Get colour palette" }).click();
    const page = await win;
    await expect(page.locator(".swatch")).toHaveCount(2);
    expect(await counts()).toMatchObject({ palette_open: 1, palette_from_find: 1 });
    await page.close();
    await editor.close();
  });

  test("an image that is fully transparent says so", async () => {
    const empty = `data:image/png;base64,${encodePng(4, 4, Buffer.alloc(64)).toString("base64")}`;
    const win = opened("palette");
    await ctx.sw.evaluate((url) => globalThis.imgkeepOpenWindow("palette", { url }), empty);
    const page = await win;
    await expect(page.locator("#problem")).toHaveText("This image is fully transparent, so it has no colours to take.");
    await expect(page.locator("#tools")).toBeHidden();
    await page.close();
  });
});
