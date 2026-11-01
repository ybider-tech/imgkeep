// Fills the Chrome Web Store listing (descriptions in every language, the screenshots, the single purpose)
// in the developer dashboard, then saves a draft. Chrome's API can't change listings, and Chrome doesn't let
// extensions script its Web Store pages, so this drives a separate Chrome over the DevTools protocol.
//
// One-time setup: a dedicated Chrome profile, signed in by Yaron (passwords are never typed by a script):
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
//     --user-data-dir="$HOME/.config/imgkeep/cws-dashboard-profile" --remote-debugging-port=9333 \
//     https://chrome.google.com/webstore/devconsole
//
//   node scripts/cws-listing.mjs                      what would change (reads the dashboard, changes nothing)
//   node scripts/cws-listing.mjs --save               fill every language the dashboard offers and the single purpose; Save draft
//   node scripts/cws-listing.mjs --save --only=en,he  just these languages
//   node scripts/cws-listing.mjs --save --screenshots also replace the screenshots (store/screenshot-*.png, list below)
//
// Texts: English from store/listing.md (Chrome's own wording), every other language from store/i18n/<lang>.json.
// It never presses Submit for review or Publish.
import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ITEM = "fkclfgbmjaafglfifenonfcahfdmajbl";
const CDP = process.env.CWS_CDP || "http://127.0.0.1:9333";
// The Chrome Web Store allows 5 screenshots: features first, trust last (decided 2026-10-12, palette 0.11.0).
const SCREENSHOTS = ["screenshot-1-menu.png", "screenshot-6-find.png", "screenshot-7-palette.png", "screenshot-5-gif.png", "screenshot-3-trust.png"];

const args = process.argv.slice(2);
const save = args.includes("--save");
const screenshots = args.includes("--screenshots");
const only = args.find((a) => a.startsWith("--only="))?.slice(7).split(",");

const block = (text, marker) => {
  const at = text.indexOf(marker);
  const start = text.indexOf("```text\n", at) + 8;
  return text.slice(start, text.indexOf("\n```", start)).trim();
};

// Dashboard language "Portuguese (Brazil) – pt-BR" ↔ our locale folder "pt_BR".
const dashboardCode = (option) => option.split("–").pop().trim().replace(/\s*\(default\)$/, "").replace("-", "_");

async function textFor(lang) {
  if (lang === "en") return block(await readFile(join(ROOT, "store", "listing.md"), "utf8"), "## Description");
  const file = join(ROOT, "store", "i18n", `${lang}.json`);
  return existsSync(file) ? JSON.parse(await readFile(file, "utf8")).storeDescription : null;
}

async function singlePurpose() {
  const md = await readFile(join(ROOT, "store", "listing.md"), "utf8");
  const at = md.indexOf("### Single purpose");
  return md.slice(at).split("\n").slice(1).find((l) => l.trim()).trim();
}

const browser = await chromium.connectOverCDP(CDP, { timeout: 20_000 }).catch(() => {
  throw new Error(`No dashboard Chrome on ${CDP}. Start it with the command at the top of this file and sign in.`);
});
const context = browser.contexts()[0];
let page = context.pages().find((p) => p.url().includes(`/${ITEM}/`)) || context.pages()[0];

async function open(section) {
  if (page.url().endsWith(`/${ITEM}/${section}`)) return;
  const base = page.url().match(/https:\/\/chrome\.google\.com\/webstore\/devconsole\/[^/]+/)?.[0];
  if (!base) throw new Error("Open the dashboard on Imgkeep's page first (it needs the publisher id from the address).");
  await page.goto(`${base}/${ITEM}/${section}`, { waitUntil: "commit" });
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(3000);
}

async function saveDraft() {
  const button = page.getByRole("button", { name: "Save draft" });
  if (!(await button.isEnabled())) return; // nothing changed since the last save
  await button.click();
  await page.waitForTimeout(3000);
}

const report = [];
const note = (line) => (report.push(line), console.log(line));

// ---- Descriptions ----
await open("edit");
const language = page.getByRole("combobox").first();
await language.click();
const options = (await page.getByRole("option").allTextContents()).map((o) => o.trim()).filter((o) => o.includes("–"));
await page.keyboard.press("Escape");
for (const option of options) {
  const lang = dashboardCode(option);
  if (only && !only.includes(lang)) continue;
  const text = await textFor(lang);
  if (!text) {
    note(`${lang}: no translation in store/i18n, left as it is`);
    continue;
  }
  await language.click();
  await page.getByRole("option", { name: option }).click();
  await page.waitForTimeout(1500);
  const box = page.locator("textarea").first();
  const current = await box.inputValue();
  if (current === text) {
    note(`${lang}: already up to date`);
    continue;
  }
  if (!save) {
    note(`${lang}: would update (${current.length} → ${text.length} characters)`);
    continue;
  }
  await box.fill(text);
  if ((await box.inputValue()) !== text) throw new Error(`${lang}: the description didn't take`);
  await saveDraft();
  note(`${lang}: updated and saved`);
}

// ---- Screenshots (global, shared by every language), only with --screenshots ----
// New ones first, then the old ones go (at least one must always be there). Each removal asks "Are you
// sure?", answered here; uploads are kept by the dashboard straight away.
const removeButtons = () => page.getByRole("button", { name: /^Remove image Screenshot/ });
if (!screenshots) note("screenshots: unchanged (add --screenshots to replace them)");
else if (!save) note(`screenshots: would replace the ${await removeButtons().count()} global screenshots with ${SCREENSHOTS.join(", ")}`);
else {
  await language.click();
  await page.getByRole("option", { name: /\(default\)/ }).click();
  await page.waitForTimeout(1500);
  const old = await removeButtons().count();
  // Inputs in page order: store icon, localized screenshots, global screenshots, small tile, marquee.
  const globalInput = page.locator('input[type="file"]').nth(2);
  for (const [i, file] of SCREENSHOTS.entries()) {
    await globalInput.setInputFiles(join(ROOT, "store", file));
    await page.waitForFunction((n) => document.querySelectorAll('[aria-label^="Remove image Screenshot"]').length >= n, old + i + 1, { timeout: 60_000 });
  }
  for (let i = 0; i < old; i++) {
    const n = await removeButtons().count();
    await removeButtons().first().click();
    await page.getByRole("button", { name: "Remove", exact: true }).click();
    await page.waitForFunction((n) => document.querySelectorAll('[aria-label^="Remove image Screenshot"]').length < n, n, { timeout: 15_000 });
  }
  if (await page.getByRole("button", { name: "Save draft" }).isEnabled()) await saveDraft();
  note(`screenshots: ${SCREENSHOTS.join(", ")}`);
}

// ---- Single purpose (Privacy practices): reached from the sidebar (its address isn't stable) ----
await open("edit");
await page.getByRole("link", { name: "Privacy", exact: true }).click();
// Wait for the address to leave the listing page: its description box is a textarea too, and filling
// that one with the single purpose once overwrote the last language's description.
await page.waitForURL((u) => !String(u).endsWith(`/${ITEM}/edit`), { timeout: 30_000 });
await page.waitForTimeout(3000);
await page.locator("textarea").first().waitFor({ timeout: 30_000 });
const purpose = await singlePurpose();
const purposeBox = page.locator("textarea").first();
if ((await purposeBox.inputValue()) === purpose) note("single purpose: already up to date");
else if (!save) note(`single purpose: would become "${purpose}"`);
else {
  await purposeBox.fill(purpose);
  await saveDraft();
  note("single purpose: updated and saved");
}

console.log(save ? "Draft saved. Nothing was submitted: review it, then press Submit for review." : "Nothing changed. Add --save to fill it in.");
process.exit(0);
