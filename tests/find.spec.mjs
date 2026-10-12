// 0.8.0: "Find image here" on sites that cover their images. The finder on pages laid out like Instagram
// and Pinterest, then the opt-in flow, the picker and the Options switch in the real extension.
import { test, expect } from "@playwright/test";
import { rm } from "node:fs/promises";
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

// Puts the pointer where a right-click would go, then runs the finder in the page, as Imgkeep does.
async function findAt(page, file, selector) {
  await page.goto(`${server.url}/covered/${file}`);
  const box = await page.locator(selector).boundingBox();
  await page.mouse.move(box.x + 70, box.y + 60);
  return page.evaluate(`(${findImageInPage.toString()})()`);
}

const name = (url) => url?.split("/").pop();

test("the finder picks the photo under a cover layer, at its largest size", async () => {
  const page = await ctx.context.newPage();
  // Without a link the pointer decides; neighbours nearby make it a guess (the picker, guess first).
  const pick = (r) => (r.found || r.guess)?.url;
  // Instagram: <img srcset> under an empty overlay div; the largest srcset entry wins.
  expect(name(pick(await findAt(page, "instagram.html", "#t1")))).toBe("wide.webp");
  expect(name(pick(await findAt(page, "instagram.html", "#t2")))).toBe("photo.jpg");
  // Pinterest: "1x, 2x, 4x" density descriptors; 4x is the original.
  expect(name(pick(await findAt(page, "pinterest.html", "#q1")))).toBe("wide.webp");
  expect(name(pick(await findAt(page, "pinterest.html", "#q2")))).toBe("photo.jpg");
  // A CSS background image on a link.
  const bg = await findAt(page, "feed.html", "#p3");
  expect(bg.guess).toMatchObject({ kind: "background" });
  expect(name(bg.guess.url)).toBe("photo.jpg");
  await page.close();
});

test("no link and other images within reach: the picker, with the pointer's guess first", async () => {
  const page = await ctx.context.newPage();
  // Threads: carousel photos side by side, no link over them.
  const r = await findAt(page, "threads.html", "#c2");
  expect(r.via).toBe("hover");
  expect(r.found).toBeNull();
  expect(name(r.guess.url)).toBe("photo.jpg");
  expect(name(r.onScreen[0].url)).toBe("photo.jpg");
  expect(r.onScreen.length).toBe(2);
  await page.close();
});

test("no link, one photo alone on screen: it opens directly", async () => {
  const page = await ctx.context.newPage();
  const r = await findAt(page, "threads-single.html", "#solo");
  expect(r.via).toBe("hover");
  expect(name(r.found?.url)).toBe("wide.webp");
  expect(r.guess).toBeNull();
  await page.close();
});

test("the right-clicked link wins over the pointer, which has moved to where the menu item was", async () => {
  const page = await ctx.context.newPage();
  await page.goto(`${server.url}/covered/pinterest-signed-in.html`);
  const pin1 = new URL("/pin/111/", server.url).href;
  // Right-clicked pin 1, but the pointer now rests on pin 2 (the menu item was over it).
  const box = await page.locator("#q2").boundingBox();
  await page.mouse.move(box.x + 70, box.y + 60);
  const r = await page.evaluate(`(${findImageInPage.toString()})(${JSON.stringify(pin1)})`);
  expect(r.via).toBe("link");
  expect(name(r.found?.url)).toBe("wide.webp"); // pin 1, at its largest
  // Without a link (a page right-click), the pointer is only a guess: pin 1 is near, so the picker.
  const h = await page.evaluate(`(${findImageInPage.toString()})(null)`);
  expect(h.via).toBe("hover");
  expect(h.found).toBeNull();
  expect(name(h.guess?.url)).toBe("photo.jpg");
  // A link Chrome reports that isn't on the page: the pointer again.
  const gone = await page.evaluate(`(${findImageInPage.toString()})("https://elsewhere.example/x")`);
  expect(gone.via).toBe("hover");
  await page.close();
});

test("a right-clicked link with no image under it: no guess, the picker", async () => {
  const page = await ctx.context.newPage();
  await page.goto(`${server.url}/covered/pinterest-signed-in.html`);
  await page.mouse.move(5, 5);
  const user = new URL("/user/x/", server.url).href;
  const r = await page.evaluate(`(${findImageInPage.toString()})(${JSON.stringify(user)})`);
  expect(r.found).toBeNull();
  expect(r.onScreen.length).toBe(2);
  await page.close();
});

test("a layer over the whole page (a sign-in wall) means: don't guess, list what's on screen", async () => {
  const page = await ctx.context.newPage();
  const r = await findAt(page, "instagram-wall.html", "#t1");
  expect(r.found).toBeNull();
  expect(r.onScreen.map((c) => name(c.url))).toEqual(expect.arrayContaining(["wide.webp", "photo.jpg"]));
  // Small things (icons, avatars under 80px) are never offered.
  expect(r.onScreen.every((c) => c.width >= 80 && c.height >= 80)).toBe(true);
  await page.close();
});

test("the finder only reads: the page is unchanged afterwards", async () => {
  const page = await ctx.context.newPage();
  await page.goto(`${server.url}/covered/instagram.html`);
  const before = await page.content();
  await page.evaluate(`(${findImageInPage.toString()})()`);
  expect(await page.content()).toBe(before);
  await page.close();
});

test("off by default: the four permissions only, and asking opens the turn-on window", async () => {
  const has = await ctx.sw.evaluate(() => chrome.permissions.contains({ permissions: ["activeTab", "scripting"] }));
  expect(has).toBe(false);
  const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/find.html") });
  await ctx.sw.evaluate((url) => globalThis.imgkeepFindImage(1, url), `${server.url}/covered/instagram.html`);
  const win = await opened;
  await expect(win.locator("#title")).toHaveText("Find images that sites cover");
  await expect(win.getByText("It never changes a page.", { exact: false })).toBeVisible();
  await expect(win.getByRole("button", { name: "Turn on" })).toBeVisible();
  await win.close();
});

// The finder's answers, given to the real background flow (Chrome only lets the scripting API reach a tab
// through a real right-click, so tests stand in for that one call).
async function withFinderResult(result, run) {
  await ctx.sw.evaluate((result) => {
    globalThis.realContains = chrome.permissions.contains;
    globalThis.realExecute = chrome.scripting?.executeScript;
    chrome.permissions.contains = async () => true;
    chrome.scripting = { ...(chrome.scripting || {}), executeScript: async () => [{ result }] };
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

test("found: the photo opens in More options", async () => {
  const url = `${server.url}/wide.webp`;
  await withFinderResult({ found: { url, kind: "img", width: 300, height: 300 }, onScreen: [] }, async () => {
    const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/editor.html") });
    await ctx.sw.evaluate((u) => globalThis.imgkeepFindImage(1, u), `${server.url}/covered/instagram.html`);
    const editor = await opened;
    await expect(editor.locator("#sourceFacts")).toContainText("×");
    await editor.close();
  });
});

test("not sure: a picker shows the images, and the one picked opens in More options", async () => {
  const onScreen = [
    { url: `${server.url}/wide.webp`, kind: "img", width: 300, height: 300 },
    { url: `${server.url}/photo.jpg`, kind: "img", width: 300, height: 200 },
    { url: "javascript:alert(1)", kind: "img", width: 300, height: 200 }, // never offered
  ];
  await withFinderResult({ found: null, onScreen }, async () => {
    const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/find.html") });
    await ctx.sw.evaluate((u) => globalThis.imgkeepFindImage(1, u), `${server.url}/covered/instagram-wall.html`);
    const win = await opened;
    await expect(win.locator("#title")).toHaveText("Which image?");
    await expect(win.locator("#grid button")).toHaveCount(2);
    const editor = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/editor.html") });
    await win.getByRole("button", { name: "Image 2" }).click();
    const ed = await editor;
    await expect(ed.locator("#sourceFacts")).toHaveText("320 × 200"); // photo.jpg
    await ed.close();
  });
});

test("nothing on screen: a plain explanation", async () => {
  await withFinderResult({ found: null, onScreen: [] }, async () => {
    const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/find.html") });
    await ctx.sw.evaluate((u) => globalThis.imgkeepFindImage(1, u), `${server.url}/covered/instagram.html`);
    const win = await opened;
    await expect(win.locator("#title")).toHaveText("No image found here");
    await win.close();
  });
});

test("a window can only pick from what the finder stored, by number", async () => {
  await withFinderResult({ found: null, onScreen: [{ url: `${server.url}/photo.jpg`, kind: "img", width: 300, height: 200 }] }, async () => {
    const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/find.html") });
    await ctx.sw.evaluate((u) => globalThis.imgkeepFindImage(1, u), `${server.url}/covered/instagram.html`);
    const win = await opened;
    const answers = await win.evaluate(async (jobId) => {
      const send = (m) => chrome.runtime.sendMessage({ target: "background", jobId, ...m });
      return [await send({ type: "pickImage", index: 5 }), await send({ type: "pickImage", index: "https://evil.example/x.png" })];
    }, new URL(win.url()).searchParams.get("job"));
    expect(answers).toEqual([{ ok: false, code: "expired" }, { ok: false, code: "expired" }]);
    await win.close();
  });
});

test("Options: the switch is off by default and explains exactly what it allows", async () => {
  const page = await ctx.context.newPage();
  await page.goto(`chrome-extension://${ctx.extensionId}/options.html`);
  await expect(page.getByLabel("Find images under cover layers")).not.toBeChecked();
  await expect(page.getByText("just that page, just then", { exact: false }).first()).toBeVisible();
  await expect(page.locator(".tag")).toHaveText(["contextMenus", "downloads", "storage", "offscreen", "activeTab", "scripting"]);
  await page.close();
});

test("Options: turning it on and off grants and removes exactly the two optional permissions", async () => {
  const page = await ctx.context.newPage();
  await page.goto(`chrome-extension://${ctx.extensionId}/options.html`);
  const box = page.getByLabel("Find images under cover layers");
  const has = () => ctx.sw.evaluate(() => chrome.permissions.contains({ permissions: ["activeTab", "scripting"] }));
  await box.click(); // no warning to show, so the browser grants it without a prompt
  await expect(page.locator("#imageFinderStatus")).toHaveText("Turned on.");
  expect(await has()).toBe(true);
  await box.click();
  await expect(page.locator("#imageFinderStatus")).toHaveText("Turned off.");
  expect(await has()).toBe(false);
  expect((await ctx.sw.evaluate(() => chrome.permissions.getAll())).permissions.sort()).toEqual(["contextMenus", "downloads", "offscreen", "storage"]);
  await page.close();
});
