// Product Hunt gallery (1270×760) from the same scenes as the store images, plus a 240×240 thumbnail.
// Run `npm run store` first so store/_capture/ has fresh captures of the real UI.
import { chromium } from "@playwright/test";
import { join, dirname } from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const STORE = join(HERE, "..");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto(pathToFileURL(join(STORE, "scenes.html")).href, { waitUntil: "networkidle" });
// Same scenes, cropped to Product Hunt's shape: content is positioned from the top-left and the logo from the right.
await page.addStyleTag({ content: ".scene { width: 1270px !important; height: 760px !important; }" });
await page.evaluate(() => document.fonts.ready);
const shots = [["#scene-1", "1-menu"], ["#scene-3", "2-trust"], ["#scene-2", "3-options"], ["#scene-4", "4-site-access"]];
for (const [sel, name] of shots) await page.locator(sel).screenshot({ path: join(HERE, `gallery-${name}.png`) });
// Thumbnail: the icon on a transparent background.
const thumb = await browser.newPage({ viewport: { width: 240, height: 240 } });
// Embedded as a data URL: a blank page isn't allowed to load file:// images.
const icon = readFileSync(join(STORE, "edge-logo-300.png")).toString("base64");
await thumb.setContent(`<body style="margin:0;background:transparent"><img src="data:image/png;base64,${icon}" style="width:240px;height:240px;display:block"></body>`);
await thumb.locator("img").evaluate((img) => img.decode());
await thumb.screenshot({ path: join(HERE, "thumbnail-240.png"), omitBackground: true });
console.log("store/producthunt/: gallery-1..4, thumbnail-240.png");
await browser.close();
