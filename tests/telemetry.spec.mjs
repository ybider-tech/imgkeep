// 0.7.0: the anonymous daily summary. Pure rules first (Node), then the real extension, with the
// service worker's fetch replaced so we can see exactly what would be sent (nothing reaches Aptabase).
import { test, expect } from "@playwright/test";
import { rm } from "node:fs/promises";
import { launchWithExtension } from "./launch.mjs";
import { startServer } from "./servers.mjs";

test.describe("rules", () => {
  test("only known counts, whole numbers and the browser get into a summary", async () => {
    const t = await import("../extension/lib/telemetry.js");
    let c = null;
    for (const key of ["save_png", "save_png", "mode_folder", "https://example.com/photo.png", "name"]) c = t.addCount(c, key, "2026-10-08");
    expect(c).toEqual({ day: "2026-10-08", c: { save_png: 2, mode_folder: 1 } });
    expect(t.dayIsOver(c, "2026-10-08")).toBe(false);
    expect(t.dayIsOver(c, "2026-10-09")).toBe(true);
    expect(t.dayIsOver({ day: "2026-10-08", c: {} }, "2026-10-09")).toBe(false); // nothing counted: nothing to send
    expect(t.summaryProps({ save_png: 2.7, fail_http: "3", site: "example.com", save_jpg: -1 }, "edge")).toEqual({
      save_png: 2,
      fail_http: 3,
      browser: "edge",
    });
    expect(t.failureKey("too-large")).toBe("fail_too_large");
    expect(t.failureKey("something-new")).toBe("fail_unknown");
  });

  test("a summary event has Aptabase's shape and a fresh session id every time", async () => {
    const t = await import("../extension/lib/telemetry.js");
    const now = new Date("2026-10-09T08:00:00Z");
    const a = t.summaryEvent({ save_png: 1, browser: "chrome" }, { appVersion: "0.7.0", locale: "en", now });
    expect(Object.keys(a).sort()).toEqual(["eventName", "props", "sessionId", "systemProps", "timestamp"]);
    expect(a).toMatchObject({
      timestamp: "2026-10-09T08:00:00.000Z",
      eventName: "daily_counts",
      systemProps: { locale: "en", isDebug: false, appVersion: "0.7.0", sdkVersion: "imgkeep-direct@1" },
      props: { save_png: 1, browser: "chrome" },
    });
    const ids = new Set(Array.from({ length: 20 }, () => t.summaryEvent({}, { now }).sessionId));
    expect(ids.size).toBe(20);
    expect(t.APTABASE.url).toBe("https://eu.aptabase.com/api/v0/event");
  });
});

test.describe("in the extension", () => {
  let ctx, cors;
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    cors = await startServer({ cors: true });
    ctx = await launchWithExtension();
    // Capture instead of sending. Only telemetry fetches from the service worker.
    await ctx.sw.evaluate(() => {
      globalThis.sent = [];
      globalThis.fetchFails = false;
      globalThis.fetch = async (url, init) => {
        globalThis.sent.push({ url, method: init.method, headers: init.headers, credentials: init.credentials, body: JSON.parse(init.body) });
        return { ok: !globalThis.fetchFails };
      };
      globalThis.imgkeepSetAppKey("A-EU-1234567890");
    });
  });

  test.afterAll(async () => {
    await ctx?.context.close();
    await cors?.close();
    if (ctx) await rm(ctx.userDataDir, { recursive: true, force: true });
  });

  test.beforeEach(async () => {
    await ctx.sw.evaluate(async () => {
      await chrome.storage.local.clear();
      await chrome.storage.sync.clear();
      globalThis.sent.length = 0;
      globalThis.fetchFails = false;
    });
  });

  const run = (url, format) => ctx.sw.evaluate(([url, format]) => globalThis.imgkeepRunJob({ url, format }, { interactive: false }), [url, format]);
  const local = (key) => ctx.sw.evaluate((k) => chrome.storage.local.get(k).then((s) => s[k]), key);
  const sent = () => ctx.sw.evaluate(() => globalThis.sent);
  // Pretend today's counts are from yesterday, then let Imgkeep notice the new day.
  const nextDay = () =>
    ctx.sw.evaluate(async () => {
      const { counts } = await chrome.storage.local.get("counts");
      const y = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const day = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`;
      await chrome.storage.local.set({ counts: { ...counts, day } });
      await globalThis.imgkeepCount();
    });

  test("saves are counted by format, mode and failure, on this computer only", async () => {
    await run(`${cors.url}/photo.webp`, "png");
    await run(`${cors.url}/photo.png`, "jpg");
    await run(`${cors.url}/missing.png`, "png");
    await ctx.sw.evaluate(() => chrome.storage.sync.set({ maxWidth: 100 }));
    await run(`${cors.url}/photo.png`, "webp");
    const counts = await local("counts");
    expect(counts.c).toEqual({ save_png: 1, save_jpg: 1, save_webp: 1, mode_downloads: 3, resized: 1, fail_http: 1 });
    expect(await sent()).toEqual([]); // nothing goes out during the day
  });

  test("the next day, one summary goes to Aptabase, and it holds only counts", async () => {
    await run(`${cors.url}/photo.webp`, "png");
    await run(`${cors.url}/missing.png`, "jpg");
    await nextDay();
    const [req] = await sent();
    expect((await sent()).length).toBe(1);
    expect(req.url).toBe("https://eu.aptabase.com/api/v0/event");
    expect(req).toMatchObject({ method: "POST", credentials: "omit", headers: { "Content-Type": "application/json", "App-Key": "A-EU-1234567890" } });
    expect(req.body.eventName).toBe("daily_counts");
    expect(req.body.props).toEqual({ save_png: 1, mode_downloads: 1, fail_http: 1, browser: "chrome" });
    // Loaded unpacked (no update_url), so Aptabase files it as a debug event.
    expect(req.body.systemProps).toMatchObject({ appVersion: "0.7.0", sdkVersion: "imgkeep-direct@1", isDebug: true });
    // No address, file or site name anywhere in what's sent.
    expect(JSON.stringify(req.body)).not.toMatch(/127\.0\.0\.1|photo|missing|http:/);
    expect(await local("countsLastSent")).toMatchObject({ props: req.body.props });
    expect(await local("countsOutbox")).toBeUndefined();
  });

  test("offline: the summary waits and goes out with the next try", async () => {
    await run(`${cors.url}/photo.webp`, "png");
    await ctx.sw.evaluate(() => (globalThis.fetchFails = true));
    await nextDay();
    expect(await local("countsOutbox")).toMatchObject({ props: { save_png: 1 } });
    await ctx.sw.evaluate(() => (globalThis.fetchFails = false));
    await ctx.sw.evaluate(() => globalThis.imgkeepCount());
    expect((await sent()).length).toBe(2);
    expect(await local("countsOutbox")).toBeUndefined();
  });

  test("turned off: what was counted is dropped, and nothing is counted or sent", async () => {
    await run(`${cors.url}/photo.webp`, "png");
    expect(await local("counts")).toBeTruthy();
    await ctx.sw.evaluate(() => chrome.storage.sync.set({ usageCounts: false }));
    await expect.poll(() => local("counts")).toBeUndefined();
    await run(`${cors.url}/photo.png`, "jpg");
    await ctx.sw.evaluate(() => globalThis.imgkeepCount());
    expect(await local("counts")).toBeUndefined();
    expect(await sent()).toEqual([]);
  });

  test("a summary that can't be sent for 7 days is dropped", async () => {
    await ctx.sw.evaluate(() => chrome.storage.local.set({ countsOutbox: { day: "2026-01-01", props: { save_png: 1, browser: "chrome" } } }));
    await ctx.sw.evaluate(() => (globalThis.fetchFails = true));
    await ctx.sw.evaluate(() => globalThis.imgkeepCount());
    expect(await local("countsOutbox")).toBeUndefined();
  });

  test("without an app key, nothing is ever sent", async () => {
    await ctx.sw.evaluate(() => globalThis.imgkeepSetAppKey(""));
    await run(`${cors.url}/photo.webp`, "png");
    await nextDay();
    expect(await sent()).toEqual([]);
    await ctx.sw.evaluate(() => globalThis.imgkeepSetAppKey("A-EU-1234567890"));
  });

  test("Options explains it, is on by default, and shows exactly what's counted", async () => {
    await run(`${cors.url}/photo.webp`, "png");
    const page = await ctx.context.newPage();
    await page.goto(`chrome-extension://${ctx.extensionId}/options.html`);
    await expect(page.getByRole("heading", { name: "Anonymous usage counts" })).toBeVisible();
    const box = page.getByLabel("Send an anonymous daily summary");
    await expect(box).toBeChecked();
    await page.getByText("See exactly what's sent").click();
    await expect(page.locator("#countsToday")).toContainText('"save_png": 1');
    await expect(page.locator("#countsLast")).toHaveText("Nothing yet.");
    await box.uncheck();
    await expect(page.locator("#countsToday")).toHaveText("Off. Nothing is counted or sent.");
    expect(await ctx.sw.evaluate(() => chrome.storage.sync.get("usageCounts"))).toEqual({ usageCounts: false });
    await page.close();
  });
});
