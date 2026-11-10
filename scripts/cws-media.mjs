// Replaces the Chrome Web Store listing's images from the brand pack, in the developer dashboard, then saves a
// draft (descriptions are scripts/cws-listing.mjs). Uses the same signed-in dashboard Chrome as cws-listing.mjs.
//   store/brand-assets-2026/chrome/icon-128.png                  store icon
//   store/brand-assets-2026/chrome/screenshots/*.png             the 5 global screenshots, in file order
//   store/brand-assets-2026/chrome/small-promo-440x280.png       small promo tile
//   store/brand-assets-2026/chrome/marquee-1400x560.png          marquee promo tile
//
//   node scripts/cws-media.mjs          what's there now and what would change (changes nothing)
//   node scripts/cws-media.mjs --save   upload them on the default language, remove the old screenshots, Save draft
//
// It never presses Submit for review or Publish.
import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PACK = join(ROOT, "store", "brand-assets-2026", "chrome");
const ITEM = "fkclfgbmjaafglfifenonfcahfdmajbl";
const CDP = process.env.CWS_CDP || "http://127.0.0.1:9333";
const save = process.argv.includes("--save");

const shots = (await readdir(join(PACK, "screenshots"))).filter((f) => f.endsWith(".png")).sort().map((f) => join(PACK, "screenshots", f));
// Upload inputs in page order: store icon, localized screenshots, global screenshots, small tile, marquee.
const SINGLES = [
  { input: 0, label: "Store icon", file: join(PACK, "icon-128.png") },
  { input: 3, label: "Small promo tile", file: join(PACK, "small-promo-440x280.png") },
  { input: 4, label: "Marquee promo tile", file: join(PACK, "marquee-1400x560.png") },
];
for (const f of [...shots, ...SINGLES.map((s) => s.file)]) if (!existsSync(f)) throw new Error(`Missing ${f}`);
if (shots.length !== 5) throw new Error(`Expected 5 screenshots, found ${shots.length}`);

const browser = await chromium.connectOverCDP(CDP, { timeout: 20_000 }).catch(() => {
  throw new Error(`No dashboard Chrome on ${CDP}. Start it as described in scripts/cws-listing.mjs and sign in.`);
});
const page = browser.contexts()[0].pages().find((p) => p.url().includes("/webstore/devconsole/")) || browser.contexts()[0].pages()[0];
const base = page.url().match(/https:\/\/chrome\.google\.com\/webstore\/devconsole\/[^/]+/)?.[0];
if (!base) throw new Error("Open the dashboard first (it needs the publisher id from the address).");
await page.goto(`${base}/${ITEM}/edit`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);

// The default language holds the images every other language falls back to.
const language = page.getByRole("combobox").first();
await language.click();
await page.getByRole("option", { name: /\(default\)/ }).click();
await page.waitForTimeout(1500);

const removeShots = () => page.getByRole("button", { name: /^Remove image Screenshot/ });
const srcOf = (label) =>
  page.evaluate((label) => {
    const button = document.querySelector(`[aria-label="Remove image ${label}"]`);
    let el = button;
    for (let k = 0; k < 6 && el; k++, el = el.parentElement) {
      const img = el.querySelector("img");
      if (img) return img.src;
    }
    return null;
  }, label);

const old = await removeShots().count();
console.log(`Now: ${old} global screenshot(s); ${SINGLES.map((s) => s.label).join(", ")} set.`);
console.log(`Would upload ${shots.length} screenshots, then remove the ${old} old ones, and replace ${SINGLES.map((s) => s.label.toLowerCase()).join(", ")}.`);
if (!save) {
  console.log("Nothing changed. Add --save to upload and save a draft.");
  process.exit(0);
}

for (const s of SINGLES) {
  const before = await srcOf(s.label);
  await page.locator('input[type="file"]').nth(s.input).setInputFiles(s.file);
  await page.waitForFunction(
    ([label, before]) => {
      let el = document.querySelector(`[aria-label="Remove image ${label}"]`);
      for (let k = 0; k < 6 && el; k++, el = el.parentElement) {
        const img = el.querySelector("img");
        if (img) return img.src && img.src !== before;
      }
      return false;
    },
    [s.label, before],
    { timeout: 60_000 },
  );
  console.log(`${s.label}: replaced`);
}

// Chrome holds at most 5 screenshots and refuses an upload when full, so swap one at a time: remove the oldest
// (always first in the list; new ones are added at the end), then add the next new one. Removal asks "Are you sure?".
const globalInput = page.locator('input[type="file"]').nth(2);
const count = () => removeShots().count();
for (let i = 0; i < old; i++) {
  const n = await count();
  await removeShots().first().click();
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await page.waitForFunction((n) => document.querySelectorAll('[aria-label^="Remove image Screenshot"]').length < n, n, { timeout: 15_000 });
  if (i < shots.length) {
    const m = await count();
    await globalInput.setInputFiles(shots[i]);
    await page.waitForFunction((m) => document.querySelectorAll('[aria-label^="Remove image Screenshot"]').length > m, m, { timeout: 60_000 });
  }
}
for (const file of shots.slice(old)) {
  const m = await count();
  await globalInput.setInputFiles(file);
  await page.waitForFunction((m) => document.querySelectorAll('[aria-label^="Remove image Screenshot"]').length > m, m, { timeout: 60_000 });
}
console.log(`Screenshots: ${await removeShots().count()} now, the brand pack's in order`);

const button = page.getByRole("button", { name: "Save draft" });
if (await button.isEnabled()) {
  await button.click();
  await page.waitForTimeout(4000);
}
console.log("Draft saved. Nothing was submitted: review it, then press Submit for review.");
process.exit(0);
