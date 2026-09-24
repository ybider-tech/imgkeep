// Renders the Chrome Web Store images from store/scenes.html.
// Step 1 captures the real extension UI (options page, trust list, ask window) into store/_capture/.
// Step 2 screenshots each scene at 1280×800 and the promo tile at 440×280.
import { chromium } from "@playwright/test";
import { mkdir, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { launchWithExtension } from "../tests/launch.mjs";
import { startServer } from "../tests/servers.mjs";

const STORE = dirname(fileURLToPath(import.meta.url));
const CAPTURE = join(STORE, "_capture");
await mkdir(CAPTURE, { recursive: true });

// ---- 1. Real UI captures ----
const ext = await launchWithExtension({ viewport: { width: 1000, height: 1100 }, deviceScaleFactor: 2, colorScheme: "light" });
const plain = await startServer({ cors: false });
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
  await options.screenshot({ path: join(CAPTURE, "options.png"), clip: { x: 0, y: 0, width: 1000, height: 580 } });
  await options.locator("#trust").screenshot({ path: join(CAPTURE, "trust.png") });

  const opened = ext.context.waitForEvent("page", { predicate: (p) => p.url().includes("/ask.html") });
  await ext.sw.evaluate((url) => globalThis.imgkeepRunJob({ url, format: "png" }), `${plain.url}/photo.webp`);
  const ask = await opened;
  await ask.setViewportSize({ width: 460, height: 300 });
  await ask.locator("#title").filter({ hasText: "Allow" }).waitFor();
  // Show a real-looking host instead of 127.0.0.1.
  await ask.evaluate(() => (document.querySelector("#body strong").textContent = "images.example.net"));
  await ask.screenshot({ path: join(CAPTURE, "ask.png") });
} finally {
  await ext.context.close();
  await plain.close();
  await rm(ext.userDataDir, { recursive: true, force: true });
}

// ---- 2. Scenes ----
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(STORE, "scenes.html")).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const shots = [
  ["#scene-1", "screenshot-1-menu.png"],
  ["#scene-2", "screenshot-2-options.png"],
  ["#scene-3", "screenshot-3-trust.png"],
  ["#scene-4", "screenshot-4-site-access.png"],
  ["#tile", "promo-tile-440x280.png"],
];
for (const [selector, file] of shots) {
  await page.locator(selector).screenshot({ path: join(STORE, file) });
  console.log(`store/${file}`);
}
await browser.close();
