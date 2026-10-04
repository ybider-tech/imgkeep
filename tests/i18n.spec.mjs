// The extension in another language: Chromium started in that language (LANGUAGE on Linux). macOS takes
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
      // Linux Chromium takes its UI language from LANGUAGE; --lang covers Windows.
      const env = { ...process.env, LANGUAGE: lang, LANG: `${lang}.UTF-8`, LC_ALL: `${lang}.UTF-8` };
      ctx = await launchWithExtension({ args: [`--lang=${lang}`], env });
    });
    test.afterAll(async () => {
      await ctx?.context.close();
      await plain?.close();
      if (ctx) await rm(ctx.userDataDir, { recursive: true, force: true });
    });

    test(`options page and ask window are in ${lang} (${dir})`, async () => {
      const ui = await ctx.sw.evaluate(() => chrome.i18n.getUILanguage());
      if (process.env.GITHUB_ACTIONS) console.log(`::notice::i18n test ${lang}: browser UI language ${ui}`);
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

      // More options, with an image that loads (so the result line is filled in).
      const editorOpened = ctx.context.waitForEvent("page", { predicate: (p) => p.url().includes("/editor.html") });
      await ctx.sw.evaluate((url) => globalThis.imgkeepOpenWindow("editor", { url }), `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><rect width="40" height="20" fill="teal"/></svg>')}`);
      const editor = await editorOpened;
      await expect(editor.locator("html")).toHaveAttribute("dir", dir);
      await expect(editor.locator("h1")).toHaveText(msg.editTitle.message);
      await expect(editor.getByRole("button", { name: msg.editSave.message })).toBeEnabled();
      await expect(editor.locator("#resultFacts bdi").first()).toHaveAttribute("dir", "ltr");
      await editor.close();
    });
  });
}
