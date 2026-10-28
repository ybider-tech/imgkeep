// Firefox: the same extension, built by scripts/build-firefox.mjs, in real Firefox (WebDriver BiDi through
// puppeteer-core; Playwright's Firefox can't load extensions). Skipped where Firefox isn't installed, except
// on CI (Linux), where it must run.
import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { startServer } from "./servers.mjs";
import { firefoxManifest, GECKO_ID } from "../scripts/build-firefox.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const UUID = "6f2a3c1e-1111-4222-8333-944455556666"; // fixed, so the test knows the extension's pages
const FIREFOX = [
  process.env.FIREFOX_PATH,
  "/Applications/Firefox.app/Contents/MacOS/firefox",
  "/usr/bin/firefox",
  "C:\\Program Files\\Mozilla Firefox\\firefox.exe",
].find((p) => p && existsSync(p));

test("the Firefox manifest: same extension, Firefox background, no offscreen, data collection declared", async () => {
  const chrome = JSON.parse(await readFile(join(ROOT, "extension", "manifest.json"), "utf8"));
  const m = firefoxManifest(chrome);
  expect(m.background).toEqual({ scripts: ["background.js"], type: "module" });
  expect(m.permissions).toEqual(chrome.permissions.filter((p) => p !== "offscreen"));
  expect(m.optional_permissions).toEqual(chrome.optional_permissions);
  expect(m.content_security_policy).toEqual(chrome.content_security_policy);
  expect(m.version).toBe(chrome.version);
  expect(m.browser_specific_settings.gecko).toMatchObject({
    id: GECKO_ID,
    data_collection_permissions: { required: ["none"], optional: ["technicalAndInteraction"] },
  });
  expect(m).not.toHaveProperty("minimum_chrome_version");
});

test.describe("in Firefox", () => {
  test.skip(!FIREFOX && !process.env.CI, "Firefox isn't installed here");
  test.describe.configure({ mode: "serial" });
  let browser, page, cors, downloads;

  test.beforeAll(async () => {
    test.setTimeout(120_000);
    execFileSync(process.execPath, [join(ROOT, "scripts", "build-firefox.mjs"), "--no-zip"]);
    const { default: puppeteer } = await import("puppeteer-core");
    cors = await startServer({ cors: true });
    downloads = await mkdtemp(join(tmpdir(), "imgkeep-ff-downloads-"));
    browser = await puppeteer.launch({
      browser: "firefox",
      executablePath: FIREFOX,
      headless: true,
      args: ["--remote-allow-system-access"], // lets the test open the extension's own pages
      extraPrefsFirefox: {
        "extensions.webextensions.uuids": JSON.stringify({ [GECKO_ID]: UUID }),
        "browser.download.dir": downloads,
        "browser.download.folderList": 2,
        "browser.download.useDownloadDir": true,
        "browser.download.always_ask_before_handling_new_types": false,
      },
    });
    expect(await browser.installExtension(join(ROOT, "dist", "firefox"))).toBe(GECKO_ID);
    page = await open("options.html");
  });

  test.afterAll(async () => {
    await browser?.close();
    await cors?.close();
    if (downloads) await rm(downloads, { recursive: true, force: true }).catch(() => {});
  });

  // Extension pages never report "load" over BiDi, so don't wait for it: wait until the page is ready.
  async function open(path) {
    const p = await browser.newPage();
    p.goto(`moz-extension://${UUID}/${path}`, { timeout: 2000 }).catch(() => {});
    await expect.poll(() => p.evaluate(() => document.readyState).catch(() => ""), { timeout: 15_000 }).toBe("complete");
    return p;
  }
  // Calls one of the background page's test hooks (Firefox keeps a background page, with a DOM).
  const hook = (name, ...args) =>
    page.evaluate(async (name, args) => (await browser.runtime.getBackgroundPage())[name](...args), name, args);
  const runAll = (url, formats) =>
    page.evaluate(async (url, formats) => {
      const bg = await browser.runtime.getBackgroundPage();
      const out = {};
      for (const format of formats) out[format] = await bg.imgkeepRunJob({ url, format }, { interactive: false });
      return JSON.parse(JSON.stringify(out));
    }, url, formats);
  // A finished download, found through the browser's own downloads list (wherever this OS put it).
  const saved = async (name) => {
    let path = null;
    const re = `(^|[\\\\/])${name.replace(/[.]/g, "\\.")}$`;
    await expect
      .poll(async () => (path = await page.evaluate((re) => chrome.downloads.search({ filenameRegex: re, state: "complete" }).then((d) => d[0]?.filename || null), re)), { timeout: 20_000 })
      .not.toBeNull();
    return readFile(path);
  };

  test("Options: no 'folder you choose', and the anonymous summary off until Firefox allows it", async () => {
    // Options fills itself in after reading the settings.
    await expect.poll(() => page.evaluate(() => document.querySelector('input[name="saveMode"][value="folder"]')?.closest("label").hidden).catch(() => false), { timeout: 15_000 }).toBe(true);
    expect(await page.evaluate(() => document.querySelector("#chooseFolder").closest(".row").hidden)).toBe(true);
    expect(await page.evaluate(() => document.querySelector("#usageCounts").checked)).toBe(false);
    // Nothing is counted without the permission, even if the setting is on.
    await page.evaluate(() => chrome.storage.sync.set({ usageCounts: true }));
    await hook("imgkeepCount", "save_png");
    expect(await page.evaluate(() => chrome.storage.local.get("counts"))).toEqual({});
  });

  test("saves every format from the menu, converted in the background page, into Downloads", async () => {
    const results = await runAll(`${cors.url}/photo.webp`, ["png", "jpg", "webp", "gif", "pdf"]);
    for (const [format, result] of Object.entries(results)) expect(result, format).toMatchObject({ ok: true, mode: "downloads" });
    expect((await saved("photo.png")).subarray(1, 4).toString()).toBe("PNG");
    expect((await saved("photo.jpg"))[0]).toBe(0xff);
    expect((await saved("photo.webp")).subarray(8, 12).toString()).toBe("WEBP");
    expect((await saved("photo.gif")).subarray(0, 4).toString()).toBe("GIF8");
    expect((await saved("photo.pdf")).subarray(0, 5).toString()).toBe("%PDF-");
  });

  test("More options formats: AVIF (the WebAssembly encoder), ICO and BMP", async () => {
    const results = await runAll(`${cors.url}/photo.png`, ["avif", "ico", "bmp"]);
    for (const [format, result] of Object.entries(results)) expect(result, format).toMatchObject({ ok: true });
    expect((await saved("photo.avif")).subarray(4, 12).toString()).toBe("ftypavif");
    expect((await saved("photo.bmp")).subarray(0, 2).toString()).toBe("BM");
    expect([...(await saved("photo.ico")).subarray(0, 4)]).toEqual([0, 0, 1, 0]);
  });

  test("Get colour palette: the window shows the colours, and saves a GIMP palette", async () => {
    // Opens its popup window; BiDi doesn't hand popups to the test, so the test opens the same job in a tab.
    const windowsBefore = await page.evaluate(() => chrome.windows.getAll().then((w) => w.length));
    const jobId = await hook("imgkeepOpenWindow", "palette", { url: `${cors.url}/photo.png` });
    await expect.poll(() => page.evaluate(() => chrome.windows.getAll().then((w) => w.length))).toBe(windowsBefore + 1);
    const win = await open(`palette.html?job=${encodeURIComponent(jobId)}`);
    await expect.poll(() => win.evaluate(() => document.querySelectorAll(".swatch").length), { timeout: 15_000 }).toBeGreaterThan(0);
    await win.evaluate(() => document.querySelector('[data-save="gpl"]').click());
    expect((await saved("photo-palette.gpl")).toString()).toMatch(/^GIMP Palette\n/);
  });
});
