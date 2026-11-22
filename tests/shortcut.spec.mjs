// 0.15.0: Alt+S saves the image under the pointer in the format used last; the toolbar button shows the images
// on screen to pick from. Both use Find image here's optional activeTab + scripting, on any site.
import { test, expect } from "@playwright/test";
import { readFile, rm } from "node:fs/promises";
import { launchWithExtension } from "./launch.mjs";
import { startServer } from "./servers.mjs";
import { findImageInPage } from "../extension/lib/find-image.js";

let ctx, server;
test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  server = await startServer({ cors: true });
  ctx = await launchWithExtension();
});

test.afterAll(async () => {
  await ctx?.context.close();
  await server?.close();
  if (ctx) await rm(ctx.userDataDir, { recursive: true, force: true });
});

const name = (url) => url?.split("/").pop();
// The shortcut as this browser shows it: "Alt+S" on Windows and Linux, "⌥S" on a Mac.
const key = () => ctx.sw.evaluate(() => chrome.commands.getAll().then((c) => c.find((x) => x.name === "save-image")?.shortcut || "Alt+S"));

test("the manifest: one shortcut (Alt+S) and a toolbar button, and no new permission", async () => {
  const m = JSON.parse(await readFile(new URL("../extension/manifest.json", import.meta.url), "utf8"));
  expect(m.commands).toEqual({ "save-image": { suggested_key: { default: "Alt+S" }, description: "__MSG_findShortcutName__" } });
  expect(m.action.default_title).toBe("__MSG_findToolbarTitle__");
  expect(m.action).not.toHaveProperty("default_popup"); // a click reaches the background, which grants activeTab
  expect(m.permissions).toEqual(["contextMenus", "downloads", "storage", "offscreen"]);
  expect(m.optional_permissions).toEqual(["activeTab", "scripting", "declarativeNetRequestWithHostAccess"]);
});

test("Alt+S: the pointer is where the user pointed, so the hovered image is taken even with neighbours", async () => {
  const page = await ctx.context.newPage();
  await page.goto(`${server.url}/covered/threads.html`);
  const box = await page.locator("#c2").boundingBox();
  await page.mouse.move(box.x + 70, box.y + 60);
  const menu = await page.evaluate(`(${findImageInPage.toString()})(null)`);
  expect(menu.found).toBeNull(); // the right-click path still guesses (the pointer may have moved to the menu)
  const shortcut = await page.evaluate(`(${findImageInPage.toString()})(null, true)`);
  expect(name(shortcut.found?.url)).toBe("photo.jpg");
  await page.close();
});

test("off: the shortcut opens a window that says what it does and turns it on", async () => {
  const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/find.html") });
  await ctx.sw.evaluate((url) => globalThis.imgkeepSaveFromPage(1, url, true), `${server.url}/covered/threads.html`);
  const win = await opened;
  await expect(win.locator("#title")).toHaveText("Save images with a shortcut");
  await expect(win.locator("#body")).toContainText(`press ${await key()} to save it in the format you used last`);
  await expect(win.locator("#body")).toContainText("It never changes a page.");
  await expect(win.getByRole("button", { name: "Turn on" })).toBeVisible();
  await win.close();
});

// Chrome only lets the scripting API reach a tab through a real key press or click, so tests stand in for that
// one call, as in find.spec.mjs.
async function withFinderResult(result, run) {
  await ctx.sw.evaluate((result) => {
    globalThis.realContains = chrome.permissions.contains;
    globalThis.realExecute = chrome.scripting?.executeScript;
    chrome.permissions.contains = async () => true;
    chrome.scripting = { ...(chrome.scripting || {}), executeScript: async (opts) => ((globalThis.lastArgs = opts.args), [{ result }]) };
  }, result);
  try {
    return await run();
  } finally {
    await ctx.sw.evaluate(() => {
      chrome.permissions.contains = globalThis.realContains;
      if (globalThis.realExecute) chrome.scripting.executeScript = globalThis.realExecute;
    });
  }
}

const saved = (re) =>
  expect
    .poll(() => ctx.sw.evaluate((re) => chrome.downloads.search({ filenameRegex: re, state: "complete" }).then((d) => d.length), re), { timeout: 15_000 })
    .toBeGreaterThan(0);

test("Alt+S over an image: saved straight away, in the format used last", async () => {
  const found = { url: `${server.url}/wide.webp`, kind: "img", width: 300, height: 300 };
  await ctx.sw.evaluate(() => chrome.storage.local.set({ lastFormat: "jpg" }));
  await withFinderResult({ found, onScreen: [found] }, async () => {
    const result = await ctx.sw.evaluate((u) => globalThis.imgkeepSaveFromPage(1, u, true), `${server.url}/covered/threads.html`);
    expect(result).toMatchObject({ ok: true });
    expect(await ctx.sw.evaluate(() => globalThis.lastArgs)).toEqual([null, true]); // exact pointer mode
  });
  await saved("wide\\.jpg$");
});

test("Alt+S with no format used yet: PNG", async () => {
  const found = { url: `${server.url}/photo.jpg`, kind: "img", width: 300, height: 200 };
  await ctx.sw.evaluate(() => chrome.storage.local.remove("lastFormat"));
  await withFinderResult({ found, onScreen: [found] }, async () => {
    expect(await ctx.sw.evaluate((u) => globalThis.imgkeepSaveFromPage(1, u, true), `${server.url}/covered/threads.html`)).toMatchObject({ ok: true });
  });
  await saved("photo\\.png$");
});

test("the toolbar button: the images on screen to pick from, never a guess", async () => {
  const onScreen = [
    { url: `${server.url}/wide.webp`, kind: "img", width: 300, height: 300 },
    { url: `${server.url}/photo.jpg`, kind: "img", width: 300, height: 200 },
  ];
  await withFinderResult({ found: onScreen[0], onScreen }, async () => {
    const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/find.html") });
    await ctx.sw.evaluate((u) => globalThis.imgkeepSaveFromPage(1, u, false), `${server.url}/covered/threads.html`);
    const win = await opened;
    await expect(win.locator("#title")).toHaveText("Which image?");
    await expect(win.locator("#grid button")).toHaveCount(2);
    expect(await ctx.sw.evaluate(() => globalThis.lastArgs)).toEqual([null, false]);
    await win.close();
  });
});

test("nothing found, or a page the browser keeps extensions out of: what to do instead", async () => {
  await withFinderResult({ found: null, onScreen: [] }, async () => {
    const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/find.html") });
    await ctx.sw.evaluate((u) => globalThis.imgkeepSaveFromPage(1, u, true), `${server.url}/covered/threads.html`);
    const win = await opened;
    await expect(win.locator("#title")).toHaveText("No image found here");
    await expect(win.locator("#body")).toContainText(`Point right at the photo and press ${await key()} again`);
    await win.close();
  });
  await ctx.sw.evaluate(() => {
    globalThis.realContains = chrome.permissions.contains;
    chrome.permissions.contains = async () => true;
    globalThis.realExecute = chrome.scripting?.executeScript;
    chrome.scripting = { ...(chrome.scripting || {}), executeScript: async () => { throw new Error("Cannot access contents of the page"); } };
  });
  try {
    const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/find.html") });
    await ctx.sw.evaluate(() => globalThis.imgkeepSaveFromPage(1, "chrome://settings/", true));
    const win = await opened;
    await expect(win.locator("#title")).toHaveText("Imgkeep couldn't look at this page");
    await expect(win.locator("#body")).toContainText("Try it on a regular web page");
    await win.close();
  } finally {
    await ctx.sw.evaluate(() => {
      chrome.permissions.contains = globalThis.realContains;
      if (globalThis.realExecute) chrome.scripting.executeScript = globalThis.realExecute;
    });
  }
});

test("Options: the shortcut is explained, with the key the browser has for it", async () => {
  const page = await ctx.context.newPage();
  await page.goto(`chrome-extension://${ctx.extensionId}/options.html`);
  await expect(page.locator("#shortcutHint")).toHaveText(`Shortcut: point at an image and press ${await key()} to save it in the format you used last, or click the Imgkeep button in the toolbar to pick from the images on screen. Both work on any site and use this setting.`);
  await page.close();
});
