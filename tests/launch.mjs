// Launches Chromium with the unpacked extension and returns its service worker.
import { chromium } from "@playwright/test";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const EXTENSION_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "extension");

export async function launchWithExtension({ headless = true, ...options } = {}) {
  const userDataDir = await mkdtemp(join(tmpdir(), "imgkeep-profile-"));
  const downloadsDir = join(userDataDir, "Downloads");
  await mkdir(join(userDataDir, "Default"), { recursive: true });
  await mkdir(downloadsDir, { recursive: true });
  // Chrome's own download folder, so saved paths keep the extension's subfolders.
  await writeFile(
    join(userDataDir, "Default", "Preferences"),
    JSON.stringify({ download: { default_directory: downloadsDir, prompt_for_download: false, directory_upgrade: true } }),
  );
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chromium",
    headless,
    ...options,
    acceptDownloads: true,
    args: [`--disable-extensions-except=${EXTENSION_DIR}`, `--load-extension=${EXTENSION_DIR}`],
  });
  // Playwright saves downloads under GUID names by default. Hand them back to Chrome,
  // so the file lands where the extension asked, inside the profile's Downloads folder.
  const page = context.pages()[0] || (await context.newPage());
  const cdp = await context.newCDPSession(page);
  await cdp.send("Browser.setDownloadBehavior", { behavior: "default" });
  await cdp.detach();
  let [sw] = context.serviceWorkers();
  sw ??= await context.waitForEvent("serviceworker");
  const extensionId = new URL(sw.url()).host;
  return { context, sw, extensionId, userDataDir, downloadsDir };
}
