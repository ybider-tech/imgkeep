// 0.14.0 "Original size": the full-size file instead of the smaller copy a site shows (lib/cdn-rules.js), and the
// new file-name tokens {site} {title} {original} {n}.
import { test, expect } from "@playwright/test";
import { readFile, rm } from "node:fs/promises";
import { relative, sep } from "node:path";
import { CDN_RULES, originalUrl } from "../extension/lib/cdn-rules.js";
import { buildTarget, targetPath, tokensFor, fillTemplate, usesNumber, DEFAULTS } from "../extension/lib/settings.js";
import { launchWithExtension } from "./launch.mjs";
import { startServer } from "./servers.mjs";

test.describe("rules (no browser)", () => {
  // [shown copy, full-size file]: one or more per image service. Synthetic addresses in each service's real shape.
  const CASES = [
    ["https://pbs.twimg.com/media/GabcDEF123?format=jpg&name=small", "https://pbs.twimg.com/media/GabcDEF123?format=jpg&name=orig"],
    ["https://pbs.twimg.com/media/GabcDEF123?format=png&name=900x900", "https://pbs.twimg.com/media/GabcDEF123?format=png&name=orig"],
    ["https://pbs.twimg.com/media/GabcDEF123.jpg:large", "https://pbs.twimg.com/media/GabcDEF123?format=jpg&name=orig"],
    ["https://pbs.twimg.com/media/GabcDEF123.jpg", "https://pbs.twimg.com/media/GabcDEF123?format=jpg&name=orig"],
    ["https://pbs.twimg.com/profile_images/123/AbC_normal.jpg", "https://pbs.twimg.com/profile_images/123/AbC.jpg"],
    ["https://pbs.twimg.com/profile_images/123/AbC_400x400.png", "https://pbs.twimg.com/profile_images/123/AbC.png"],
    ["https://i.pinimg.com/236x/1a/2b/3c/1a2b3c4d5e.jpg", "https://i.pinimg.com/originals/1a/2b/3c/1a2b3c4d5e.jpg"],
    ["https://i.pinimg.com/736x/1a/2b/3c/1a2b3c4d5e.jpg", "https://i.pinimg.com/originals/1a/2b/3c/1a2b3c4d5e.jpg"],
    ["https://i.pinimg.com/75x75_RS/1a/2b/3c/1a2b3c4d5e.jpg", "https://i.pinimg.com/originals/1a/2b/3c/1a2b3c4d5e.jpg"],
    ["https://cdn.shopify.com/s/files/1/0001/files/shirt_400x.jpg?v=1700000000", "https://cdn.shopify.com/s/files/1/0001/files/shirt.jpg?v=1700000000"],
    ["https://cdn.shopify.com/s/files/1/0001/products/shirt_800x800_crop_center@2x.png?v=1", "https://cdn.shopify.com/s/files/1/0001/products/shirt.png?v=1"],
    ["https://cdn.shopify.com/s/files/1/0001/products/shirt_grande.jpg", "https://cdn.shopify.com/s/files/1/0001/products/shirt.jpg"],
    ["https://shop.example.com/cdn/shop/files/shirt.jpg?v=1&width=533", "https://shop.example.com/cdn/shop/files/shirt.jpg?v=1"],
    ["https://blog.example.com/wp-content/uploads/2024/05/cat-300x200.jpg", "https://blog.example.com/wp-content/uploads/2024/05/cat.jpg"],
    ["https://i0.wp.com/blog.example.com/wp-content/uploads/2024/05/cat.jpg?resize=300%2C200&ssl=1", "https://i0.wp.com/blog.example.com/wp-content/uploads/2024/05/cat.jpg?ssl=1"],
    ["https://i.etsystatic.com/123/r/il/abc123/4567/il_340x270.4567_abcd.jpg", "https://i.etsystatic.com/123/r/il/abc123/4567/il_fullxfull.4567_abcd.jpg"],
    ["https://i.etsystatic.com/123/r/il/abc123/4567/il_794xN.4567_abcd.jpg", "https://i.etsystatic.com/123/r/il/abc123/4567/il_fullxfull.4567_abcd.jpg"],
    ["https://preview.redd.it/abc123xyz.jpg?width=640&crop=smart&auto=webp&s=0123", "https://i.redd.it/abc123xyz.jpg"],
    ["https://images.unsplash.com/photo-1500000000000-abcdef?w=400&q=80&fm=jpg&crop=entropy&ixid=x", "https://images.unsplash.com/photo-1500000000000-abcdef?ixid=x"],
    ["https://assets.imgix.net/hero.png?w=600&dpr=2&auto=format", "https://assets.imgix.net/hero.png"],
    ["https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Cat_photo.jpg/220px-Cat_photo.jpg", "https://upload.wikimedia.org/wikipedia/commons/a/ab/Cat_photo.jpg"],
    ["https://upload.wikimedia.org/wikipedia/en/thumb/0/0f/Poster.png/330px-Poster.png", "https://upload.wikimedia.org/wikipedia/en/0/0f/Poster.png"],
  ];

  test("each image service: the shown copy → its full-size file", () => {
    for (const [shown, full] of CASES) expect(originalUrl(shown), shown).toBe(full);
  });

  test("every rule has a case above", () => {
    const covered = new Set(CASES.map(([shown]) => CDN_RULES.find((r) => r.test(new URL(shown))).name));
    expect([...covered].sort()).toEqual(CDN_RULES.map((r) => r.name).sort());
  });

  test("already full size, other sites and other kinds of address: nothing to change", () => {
    for (const url of [
      ...CASES.map(([, full]) => full), // asking again changes nothing
      "https://example.com/photo-300x200.jpg", // a size in the name, but not a WordPress upload
      "https://i.pinimg.com/originals/1a/2b/3c/1a2b3c4d5e.jpg",
      "https://pbs.twimg.com/card_img/123/abc?format=jpg&name=small", // not /media/ or /profile_images/
      "https://preview.redd.it/some/deeper/path.jpg?width=640",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Map.svg/220px-Map.svg.png", // an SVG's picture
      "https://upload.wikimedia.org/wikipedia/commons/a/ab/Cat_photo.jpg",
      "data:image/png;base64,AAAA",
      "blob:https://example.com/1234",
      "not a url",
    ]) {
      expect(originalUrl(url), url).toBeNull();
    }
  });

  test("the full-size file is always on the same site as the copy (never anywhere else)", () => {
    const site = (h) => h.split(".").slice(-2).join(".");
    for (const [shown] of CASES) {
      expect(site(new URL(originalUrl(shown)).hostname), shown).toBe(site(new URL(shown).hostname));
    }
  });

  test("off by default", () => {
    expect(DEFAULTS.originalSize).toBe(false);
  });

  test("new tokens: {site} {title} {original} {n}", () => {
    const now = new Date(2026, 10, 15, 9, 5, 7);
    const t = tokensFor({ url: "https://cdn.example.net/img/cat.webp", pageUrl: "https://www.shop.example.com/sale", title: "  Summer sale  ", n: 7, now });
    expect(t).toMatchObject({ name: "cat", host: "cdn.example.net", site: "shop.example.com", title: "Summer sale", original: "cat.webp", n: "7" });
    expect(fillTemplate("{site}-{n}-{name}", t)).toBe("shop.example.com-7-cat");
    // Unknown title and number: dropped with their separators, as other empty tokens are.
    expect(fillTemplate("{name}-{title}-{n}", { ...t, title: "", n: "" })).toBe("cat");
    // {original} keeps the site's extension inside the name: cat.webp.png
    const target = buildTarget({ settings: { subfolder: "{site}", filenameTemplate: "{original}" }, url: "https://cdn.example.net/img/cat.webp", pageUrl: "https://shop.example.com/", ext: "png", now });
    expect(targetPath(target)).toBe("shop.example.com/cat.webp.png");
    // A title with characters files can't have.
    const titled = buildTarget({ settings: { filenameTemplate: "{title}" }, url: "https://x.example/a.png", title: 'Cats: "best" / worst?', ext: "png", now });
    expect(targetPath(titled)).toBe("Cats best worst.png");
    expect(usesNumber({ filenameTemplate: "{name}-{n}" })).toBe(true);
    expect(usesNumber({ filenameTemplate: "{name}", subfolder: "batch-{n}" })).toBe(true);
    expect(usesNumber({ filenameTemplate: "{name}" })).toBe(false);
  });
});

test.describe("in the extension", () => {
  test.describe.configure({ mode: "serial" });
  let ctx, cors, blank;

  test.beforeAll(async () => {
    cors = await startServer({ cors: true });
    ctx = await launchWithExtension();
    blank = await ctx.context.newPage();
    await blank.goto(`${cors.url}/photo.svg`);
  });

  test.afterAll(async () => {
    await ctx?.context.close();
    await cors?.close();
    if (ctx) await rm(ctx.userDataDir, { recursive: true, force: true });
  });

  test.afterEach(async () => {
    await ctx.sw.evaluate(() => Promise.all([chrome.storage.sync.clear(), chrome.storage.local.remove(["counts", "nameNumber"])]));
  });

  const run = (input) => ctx.sw.evaluate((input) => globalThis.imgkeepRunJob(input, { interactive: false }), input);
  const counts = () => ctx.sw.evaluate(() => chrome.storage.local.get("counts").then((s) => s.counts?.c || {}));
  const finished = (id) =>
    ctx.sw.evaluate(async (id) => {
      for (let i = 0; i < 300; i++) {
        const [d] = await chrome.downloads.search({ id });
        if (d && d.state !== "in_progress" && d.filename) return { state: d.state, filename: d.filename };
        await new Promise((r) => setTimeout(r, 100));
      }
      return { state: "timeout" };
    }, id);
  async function saved(input) {
    const result = await run(input);
    expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
    const dl = await finished(result.downloadId);
    expect(dl.state).toBe("complete");
    const bytes = await readFile(dl.filename);
    const size = await blank.evaluate(async (b64) => {
      const bmp = await createImageBitmap(new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))]));
      return `${bmp.width}x${bmp.height}`;
    }, bytes.toString("base64"));
    return { result, size, rel: relative(ctx.downloadsDir, dl.filename).split(sep).join("/") };
  }
  const shown = (kind) => `${cors.url}/wp-content/uploads/${kind}/photo-30x20.png`;
  const fetched = (kind) => cors.requests.filter((r) => r.path.startsWith(`/wp-content/uploads/${kind}/`)).map((r) => r.path.split("/").pop());
  // Which files were requested since `from` (each once or twice: the first try carries cookies, which this
  // test server's "any site" CORS answer refuses, so the browser asks again without them).
  const asked = (kind, from) => [...new Set(fetched(kind).slice(from))];

  test("off (the default): the image that was clicked, as before, and the full-size file is never asked for", async () => {
    const before = fetched("full").length;
    const out = await saved({ url: shown("full"), format: "png" });
    expect(out.size).toBe("30x20");
    expect(out.rel).toMatch(/^photo-30x20( \(\d+\))?\.png$/);
    expect(asked("full", before)).toEqual(["photo-30x20.png"]);
  });

  test("on: the full-size file, named after it, and counted", async () => {
    await ctx.sw.evaluate(() => chrome.storage.sync.set({ originalSize: true, subfolder: "full" }));
    const before = fetched("full").length;
    const out = await saved({ url: shown("full"), format: "jpg" });
    expect(out.size).toBe("300x200");
    expect(out.rel).toBe("full/photo.jpg");
    expect(out.result.fromOriginal).toBe(true);
    expect(asked("full", before)).toEqual(["photo.png"]); // only the full-size file: the copy wasn't needed
    expect(await counts()).toMatchObject({ save_jpg: 1, original_size: 1 });
  });

  test("on, but the full-size file isn't there or isn't an image: the clicked image, with no question and no error", async () => {
    await ctx.sw.evaluate(() => chrome.storage.sync.set({ originalSize: true, subfolder: "fallback" }));
    for (const kind of ["missing", "html"]) {
      const before = fetched(kind).length;
      const out = await saved({ url: shown(kind), format: "png" });
      expect(out.size, kind).toBe("30x20");
      expect(out.rel).toMatch(/^fallback\/photo-30x20( \(\d+\))?\.png$/);
      expect(out.result.fromOriginal).toBe(false);
      expect(asked(kind, before)).toEqual(["photo.png", "photo-30x20.png"]);
    }
    expect(await counts()).not.toHaveProperty("original_size");
  });

  test("on, Original format: the full-size file's own bytes", async () => {
    await ctx.sw.evaluate(() => chrome.storage.sync.set({ originalSize: true, subfolder: "as-is" }));
    const out = await saved({ url: shown("full"), format: "original" });
    expect(out.size).toBe("300x200");
    expect(out.rel).toBe("as-is/photo.png");
  });

  test("on: More options shows the full-size file (Copy as PNG converts through the same path)", async () => {
    await ctx.sw.evaluate(() => chrome.storage.sync.set({ originalSize: true }));
    const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/editor.html") });
    await ctx.sw.evaluate((url) => globalThis.imgkeepOpenWindow("editor", { url, pageUrl: "" }), shown("full"));
    const editor = await opened;
    await expect(editor.locator("#sourceFacts")).toHaveText(/300\s*×\s*200/);
    await editor.close();
  });

  test("{site}, {n} and {title} in file names", async () => {
    await ctx.sw.evaluate(() => chrome.storage.sync.set({ subfolder: "{site}", filenameTemplate: "{title}-{n}" }));
    const page = "https://shop.example.com/sale";
    const a = await saved({ url: `${cors.url}/photo.png`, pageUrl: page, pageTitle: "Summer sale", format: "png" });
    const b = await saved({ url: `${cors.url}/photo.png`, pageUrl: page, pageTitle: "Summer sale", format: "png" });
    expect(a.rel).toBe("shop.example.com/Summer sale-1.png");
    expect(b.rel).toBe("shop.example.com/Summer sale-2.png");
    // Without a title (the browser didn't share it): just the number.
    const c = await saved({ url: `${cors.url}/photo.png`, pageUrl: page, format: "png" });
    expect(c.rel).toBe("shop.example.com/3.png");
  });
});
