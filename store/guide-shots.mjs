// Renders the screenshots used in the site's guides, into site/media/guides/ (npm run guide-shots).
// The Options page and trust list are captured from the real extension. Chrome's right-click menu is native
// and can't be captured by automation, so the menu shots come from store/scenes.html, which redraws it with
// Imgkeep's real labels (the same scene as the store's first screenshot).
import { chromium } from "@playwright/test";
import { mkdir, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { launchWithExtension } from "../tests/launch.mjs";

const STORE = dirname(fileURLToPath(import.meta.url));
const OUT = join(STORE, "..", "site", "media", "guides");
await mkdir(OUT, { recursive: true });
const jpg = (name) => ({ path: join(OUT, name), type: "jpeg", quality: 82 });

// ---- Real extension UI ----
const ext = await launchWithExtension({ viewport: { width: 760, height: 1100 }, deviceScaleFactor: 1.5, colorScheme: "light" });
try {
  await ext.sw.evaluate(() =>
    chrome.storage.sync.set({ saveMode: "folder", subfolder: "Imgkeep/{host}", filenameTemplate: "{name}-{w}x{h}" }),
  );
  const options = await ext.context.newPage();
  await options.goto(`chrome-extension://${ext.extensionId}/options.html`);
  // A folder from the extension's private storage stands in for one picked with the real dialog.
  await options.evaluate(async () => {
    const { setFolder } = await import("./lib/folder.js");
    const root = await navigator.storage.getDirectory();
    await setFolder(await root.getDirectoryHandle("Pictures", { create: true }));
  });
  await options.reload();
  await options.locator("#folderStatus").filter({ hasText: "connected" }).waitFor();
  await options.locator("section").first().screenshot(jpg("options-folder.jpg"));
  await options.locator("#trust").screenshot(jpg("trust.jpg"));
} finally {
  await ext.context.close();
  await rm(ext.userDataDir, { recursive: true, force: true });
}

// ---- Right-click menu, one shot per highlighted format ----
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(STORE, "scenes.html")).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
for (const [format, url, file] of [
  ["PNG", "shop.example.com/products/stoneware-mug", "menu-png.jpg"],
  ["JPG", "photos.example.com/gallery/stoneware-mug", "menu-jpg.jpg"],
]) {
  await page.evaluate(([format, url]) => {
    const scene = document.querySelector("#scene-1");
    scene.querySelector(".head").style.display = "none";
    scene.querySelector(".logo").style.display = "none";
    const b = scene.querySelector(".browser");
    Object.assign(b.style, { top: "40px", height: "560px" });
    b.querySelector(".url").textContent = url;
    const items = [...scene.querySelectorAll(".menu")[1].children].filter((d) => d.tagName === "DIV");
    for (const d of items) d.classList.toggle("on", d.textContent === format);
    // Move the pointer onto the highlighted item.
    const on = items.find((d) => d.textContent === format);
    scene.querySelector(".cursor").style.top = `${318 + on.offsetTop - items[0].offsetTop}px`;
  }, [format, url]);
  await page.locator("#scene-1 .browser").screenshot(jpg(file));
  console.log(`site/media/guides/${file}`);
}
await browser.close();
console.log("site/media/guides/options-folder.jpg, trust.jpg");
