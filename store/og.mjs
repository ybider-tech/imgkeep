// Renders store/og.html to site/og-image.png, the 1200×630 preview shown when imgkeep.app is shared (npm run og).
import { chromium } from "@playwright/test";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const STORE = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(pathToFileURL(join(STORE, "og.html")).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.locator("#og").screenshot({ path: join(STORE, "..", "site", "og-image.png") });
await browser.close();
console.log("site/og-image.png");
