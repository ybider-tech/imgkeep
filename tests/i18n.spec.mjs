// The extension in another language: Chromium started with --lang. Linux honours the flag; macOS takes
// the language from the system, so there these tests skip themselves. On Linux (GitHub Actions) they must run.
import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { launchWithExtension } from "./launch.mjs";
import { startServer } from "./servers.mjs";

const LOCALES = join(dirname(fileURLToPath(import.meta.url)), "..", "extension", "_locales");
const messages = async (lang) => JSON.parse(await readFile(join(LOCALES, lang, "messages.json"), "utf8"));

for (const [lang, dir] of [["he", "rtl"], ["ja", "ltr"]]) {
  test.describe(`extension in ${lang}`, () => {
    let ctx, plain, msg;
    test.beforeAll(async () => {
      msg = await messages(lang);
      plain = await startServer({ cors: false });
      ctx = await launchWithExtension({ args: [`--lang=${lang}`] });
    });
    test.afterAll(async () => {
      await ctx?.context.close();
      await plain?.close();
      if (ctx) await rm(ctx.userDataDir, { recursive: true, force: true });
    });

    test(`options page and ask window are in ${lang} (${dir})`, async () => {
      const ui = await ctx.sw.evaluate(() => chrome.i18n.getUILanguage());
      // Only macOS may skip: on Linux (CI) a wrong language is a failure, so a green run proves these tests ran.
      test.skip(process.platform === "darwin" && !ui.startsWith(lang), `browser UI language is ${ui}: --lang isn't honoured on macOS`);
      expect(ui.startsWith(lang), `browser UI language is ${ui}, expected ${lang}`).toBe(true);
      expect(await ctx.sw.evaluate(() => chrome.i18n.getMessage("menuParent"))).toBe(msg.menuParent.message);

      const page = await ctx.context.newPage();
      await page.goto(`chrome-extension://${ctx.extensionId}/options.html`);
      await expect(page.locator("html")).toHaveAttribute("dir", dir);
      await expect(page.locator("#h-where")).toHaveText(msg.optWhereTitle.message);
      await expect(page.locator("#folderStatus")).toHaveText(msg.optNoFolder.message);
      await expect(page).toHaveTitle(msg.optPageTitle.message);
      await page.close();

      const opened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/ask.html") });
      await ctx.sw.evaluate((url) => globalThis.imgkeepRunJob({ url, format: "png" }), `${plain.url}/photo.webp`);
      const ask = await opened;
      await expect(ask.locator("#title")).toHaveText(msg.askHostTitle.message);
      await expect(ask.locator("#body strong")).toHaveText("127.0.0.1"); // the site name stays bold in any word order
      await expect(ask.getByRole("button", { name: msg.askAllowAndSave.message })).toBeVisible();
      await expect(ask.locator("html")).toHaveAttribute("dir", dir);
      await ask.close();
    });
  });
}
