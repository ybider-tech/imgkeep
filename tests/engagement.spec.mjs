// 0.6.1: "New" labels in the right-click menu after an update, and the one rating ask.
// Pure rules first (Node), then the real extension in Chromium.
import { test, expect } from "@playwright/test";
import { rm } from "node:fs/promises";
import { launchWithExtension } from "./launch.mjs";
import { startServer } from "./servers.mjs";

const DAY = 24 * 60 * 60 * 1000;

test.describe("rules", () => {
  test("versions and which menu items are new", async () => {
    const { compareVersions, newItemsSince } = await import("../extension/lib/review.js");
    expect(compareVersions("0.6.0", "0.5.0")).toBe(1);
    expect(compareVersions("0.6.0", "0.6.0")).toBe(0);
    expect(compareVersions("0.10.0", "0.9.9")).toBe(1);
    expect(newItemsSince("0.4.0")).toEqual(["imgkeep-pdf", "imgkeep-copy", "imgkeep-more"]);
    expect(newItemsSince("0.5.0")).toEqual(["imgkeep-copy", "imgkeep-more"]);
    expect(newItemsSince("0.6.0")).toEqual([]);
  });

  test("the rating ask: after real use, never during failures, once", async () => {
    const r = await import("../extension/lib/review.js");
    const now = 100 * DAY;
    let u = r.newUsage(now - 8 * DAY);
    for (let i = 0; i < 14; i++) u = r.recordUse(u, true);
    expect(r.readyToAsk(u, now)).toBe(false); // 14 uses
    u = r.recordUse(u, true);
    expect(r.readyToAsk(u, now)).toBe(true); // 15 uses, 8 days
    expect(r.readyToAsk({ ...u, firstSeen: now - 6 * DAY }, now)).toBe(false); // too soon
    expect(r.readyToAsk(r.recordUse(u, false), now)).toBe(false); // a failure among the last 3
    expect(r.recordUse(r.recordUse(r.recordUse(r.recordUse(u, false), true), true), true).recent).toEqual([true, true, true]);
    // One window ask, ever; the menu item for 14 days at most.
    expect(r.windowCanAsk(u, now)).toBe(true);
    const asked = r.markWindowAsked(u, now);
    expect(r.windowCanAsk(asked, now)).toBe(false);
    expect(r.menuAskVisible(asked, now + 13 * DAY)).toBe(true);
    expect(r.menuAskVisible(asked, now + 14 * DAY)).toBe(false);
    expect(r.askExpired(asked, now + 14 * DAY)).toBe(true);
    // Answered: never again.
    const done = r.finishAsk(asked);
    expect([r.readyToAsk(done, now), r.menuAskVisible(done, now), r.windowCanAsk(done, now)]).toEqual([false, false, false]);
  });

  test("the review page matches the browser", async () => {
    const { reviewUrl } = await import("../extension/lib/review.js");
    expect(reviewUrl("Mozilla/5.0 … Chrome/141.0.0.0 Safari/537.36")).toMatch(/^https:\/\/chromewebstore\.google\.com\/.*\/reviews$/);
    expect(reviewUrl("Mozilla/5.0 … Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0")).toMatch(/^https:\/\/microsoftedge\.microsoft\.com\/addons\//);
  });
});

test.describe("in the extension", () => {
  let ctx, cors;
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    cors = await startServer({ cors: true });
    ctx = await launchWithExtension();
    // Store pages never load in tests.
    await ctx.context.route(/chromewebstore\.google\.com|microsoftedge\.microsoft\.com/, (r) => r.fulfill({ body: "store" }));
  });

  test.afterAll(async () => {
    await ctx?.context.close();
    await cors?.close();
    if (ctx) await rm(ctx.userDataDir, { recursive: true, force: true });
  });

  test.beforeEach(async () => {
    await ctx.sw.evaluate(() => chrome.storage.local.clear());
  });

  const titles = () => ctx.sw.evaluate(() => Object.fromEntries(globalThis.imgkeepMenuTitles));
  const installed = (details) => ctx.sw.evaluate((d) => globalThis.imgkeepOnInstalled(d), details);
  const setUsage = (usage) => ctx.sw.evaluate((u) => chrome.storage.local.set({ usage: u }).then(() => globalThis.imgkeepRefreshMenus()), usage);
  const usage = () => ctx.sw.evaluate(() => chrome.storage.local.get("usage").then((s) => s.usage));
  const ready = () => ({ firstSeen: Date.now() - 8 * DAY, uses: 20, recent: [true, true, true], ask: "waiting" });

  async function copyWindow() {
    const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/copy.html") });
    await ctx.sw.evaluate((url) => globalThis.imgkeepOpenWindow("copy", { url }), `${cors.url}/photo.png`);
    const win = await opened;
    await expect(win.locator("#status")).toHaveText("Copied as PNG. Paste it anywhere.");
    return win;
  }

  test("after updating from 0.4.0, the newer menu items say New; after 30 days they don't", async () => {
    await installed({ reason: "update", previousVersion: "0.4.0" });
    expect(await titles()).toMatchObject({
      "imgkeep-png": "PNG",
      "imgkeep-pdf": "PDF ✨ New",
      "imgkeep-copy": "Copy as PNG ✨ New",
      "imgkeep-more": "More options… ✨ New",
    });
    await ctx.sw.evaluate(() =>
      chrome.storage.local.get("menuNew").then(({ menuNew }) => chrome.storage.local.set({ menuNew: { ...menuNew, until: Date.now() - 1 } })),
    );
    await ctx.sw.evaluate(() => globalThis.imgkeepRefreshMenus());
    expect(await titles()).toMatchObject({ "imgkeep-pdf": "PDF", "imgkeep-copy": "Copy as PNG", "imgkeep-more": "More options…" });
    expect(await ctx.sw.evaluate(() => chrome.storage.local.get("menuNew"))).toEqual({});
  });

  test("a fresh install, or an update with no new items, labels nothing", async () => {
    for (const details of [{ reason: "install" }, { reason: "update", previousVersion: "0.6.0" }]) {
      await installed(details);
      const t = await titles();
      expect(Object.values(t).some((title) => title.includes("New")), JSON.stringify(t)).toBe(false);
    }
    expect((await usage()).ask).toBe("waiting");
  });

  test("before it's due, nothing is asked, and uses are counted", async () => {
    await installed({ reason: "install" });
    const win = await copyWindow();
    await win.waitForEvent("close", { timeout: 5000 }); // closes by itself, no ask
    expect(await usage()).toMatchObject({ uses: 1, recent: [true], ask: "waiting" });
    expect(await titles()).not.toHaveProperty("imgkeep-rate");
  });

  test("failed saves count against it; site and folder questions don't count", async () => {
    await installed({ reason: "install" });
    await ctx.sw.evaluate((url) => globalThis.imgkeepRunJob({ url, format: "png" }, { interactive: false }), `${cors.url}/missing.png`);
    expect(await usage()).toMatchObject({ uses: 0, recent: [false] });
    await ctx.sw.evaluate(() => chrome.storage.sync.set({ saveMode: "folder" }));
    await ctx.sw.evaluate((url) => globalThis.imgkeepRunJob({ url, format: "png" }, { interactive: false }), `${cors.url}/photo.png`);
    await ctx.sw.evaluate(() => chrome.storage.sync.clear());
    expect(await usage()).toMatchObject({ uses: 0, recent: [false] });
  });

  test("when due: the menu offers it, one window asks once, and No thanks ends it", async () => {
    await setUsage(ready());
    expect(await titles()).toHaveProperty("imgkeep-rate", "Enjoying Imgkeep? Rate it…");
    const win = await copyWindow();
    await expect(win.getByRole("group", { name: "Enjoying Imgkeep?" })).toBeVisible();
    await expect(win.getByText("we'll only ask this once", { exact: false })).toBeVisible();
    await win.getByRole("button", { name: "No thanks" }).click();
    await expect(win.getByText("Got it. We won't ask again.")).toBeVisible();
    await win.waitForEvent("close", { timeout: 5000 });
    expect((await usage()).ask).toBe("done");
    expect(await titles()).not.toHaveProperty("imgkeep-rate");
    // The next copy doesn't ask.
    const again = await copyWindow();
    await again.waitForEvent("close", { timeout: 5000 });
  });

  test("a window asks only once, even if it was closed without an answer", async () => {
    await setUsage(ready());
    const first = await copyWindow();
    await expect(first.getByRole("button", { name: "Rate Imgkeep" })).toBeVisible();
    await first.close();
    const second = await copyWindow();
    await second.waitForEvent("close", { timeout: 5000 }); // no ask this time
    expect(await titles()).toHaveProperty("imgkeep-rate"); // the menu item still offers it, for up to 14 days
    await setUsage({ ...(await usage()), askedAt: Date.now() - 15 * DAY });
    expect(await titles()).not.toHaveProperty("imgkeep-rate");
    expect((await usage()).ask).toBe("done");
  });

  test("after a worker restart, an answered ask still removes its menu item", async () => {
    await setUsage(ready());
    expect(await titles()).toHaveProperty("imgkeep-rate");
    // A restarted worker has an empty record of the menu, but the item is still there.
    await ctx.sw.evaluate(() => globalThis.imgkeepMenuTitles.delete("imgkeep-rate"));
    await setUsage({ ...(await usage()), ask: "done" });
    const exists = await ctx.sw.evaluate(
      () => new Promise((r) => chrome.contextMenus.update("imgkeep-rate", {}, () => r(!chrome.runtime.lastError))),
    );
    expect(exists).toBe(false);
  });

  test("Rate Imgkeep opens this browser's review page, from the menu's window", async () => {
    await setUsage(ready());
    const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/rate.html") });
    await ctx.sw.evaluate(() => globalThis.imgkeepOpenRateWindow());
    const win = await opened;
    const store = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("chromewebstore.google.com") });
    await win.getByRole("button", { name: "Rate Imgkeep" }).click();
    // The store may redirect to a URL with the listing's name in it; it's still Imgkeep's reviews.
    expect((await store).url()).toMatch(/^https:\/\/chromewebstore\.google\.com\/detail\/(.+\/)?fkclfgbmjaafglfifenonfcahfdmajbl\/reviews$/);
    expect((await usage()).ask).toBe("done");
    await (await store).close();
  });

  test("More options asks after a save, when it's due", async () => {
    await setUsage(ready());
    const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/editor.html") });
    await ctx.sw.evaluate((url) => globalThis.imgkeepOpenWindow("editor", { url }), `${cors.url}/photo.png`);
    const win = await opened;
    await expect(win.locator("#resultFacts")).toContainText("320 × 200");
    await expect(win.locator("#review")).toBeEmpty();
    await win.getByRole("button", { name: "Save" }).click();
    await expect(win.locator("#status")).toContainText("Saved as");
    await expect(win.getByRole("button", { name: "Rate Imgkeep" })).toBeVisible();
    await win.close();
  });

  test("Options always has a quiet Rate Imgkeep link and What's new", async () => {
    const page = await ctx.context.newPage();
    await page.goto(`chrome-extension://${ctx.extensionId}/options.html`);
    await expect(page.getByRole("link", { name: "Rate Imgkeep" })).toHaveAttribute(
      "href",
      "https://chromewebstore.google.com/detail/fkclfgbmjaafglfifenonfcahfdmajbl/reviews",
    );
    await expect(page.getByRole("link", { name: "What's new" })).toHaveAttribute("href", "https://imgkeep.app/whats-new.html");
    await expect(page.getByText("Imgkeep asks for a rating once", { exact: false })).toBeVisible();
    await page.close();
  });
});
