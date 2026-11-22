// Builds the Firefox package from the same extension/ folder: only the manifest differs.
//   dist/firefox/                     unpacked, for `web-ext run` and testing
//   dist/imgkeep-firefox-<version>.zip  for addons.mozilla.org
// Firefox's MV3 background is a page with a DOM (no service worker, no offscreen documents), so it runs
// offscreen.js itself (see extension/lib/browser.js). Everything else is the same code.
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "extension");
const OUT = join(ROOT, "dist", "firefox");

// The add-on's permanent id on addons.mozilla.org. Never change it after the first submission.
export const GECKO_ID = "imgkeep@imgkeep.app";

export function firefoxManifest(chrome) {
  const m = structuredClone(chrome);
  delete m.minimum_chrome_version;
  m.background = { scripts: ["background.js"], type: "module" };
  m.permissions = m.permissions.filter((p) => p !== "offscreen");
  // Alt+S opens Firefox's History menu on Windows and Linux, so Firefox gets Alt+Shift+S (changeable in about:addons).
  if (m.commands?.["save-image"]) m.commands["save-image"].suggested_key = { default: "Alt+Shift+S" };
  m.browser_specific_settings = {
    gecko: {
      id: GECKO_ID,
      // 140 (ESR): the data collection permissions below, and images on the clipboard.
      strict_min_version: "140.0",
      // Nothing is required. The anonymous daily summary is "technical and interaction data", which
      // Firefox asks about at install, off unless the user turns it on.
      data_collection_permissions: { required: ["none"], optional: ["technicalAndInteraction"] },
    },
  };
  return m;
}

// addons.mozilla.org takes the add-on's name from each language's extName and cuts it at 50 characters (German
// showed "…oder PDF —"). So Firefox gets names that fit: the name as it is when short enough, else without
// " — Imgkeep" (AMO shows "by Imgkeep" under it), else a shorter wording written for AMO.
export const AMO_NAME_MAX = 50;
const SHORTER_NAMES = {
  hu: "Kép mentése PNG, JPG, WebP, GIF, PDF formátumban",
  ru: "Сохранить картинку как PNG, JPG, WebP, GIF или PDF",
};
export function firefoxName(lang, name) {
  if ([...name].length <= AMO_NAME_MAX) return name;
  const bare = name.replace(/\s*[—–-]\s*Imgkeep\s*$/, "");
  if ([...bare].length <= AMO_NAME_MAX) return bare;
  return SHORTER_NAMES[lang] || name; // a language AMO doesn't list keeps its name (Firefox itself allows 75)
}

// Run as a script (not when a test imports firefoxManifest).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const manifest = JSON.parse(await readFile(join(SRC, "manifest.json"), "utf8"));
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await cp(SRC, OUT, {
    recursive: true,
    // Chrome-only: the offscreen page itself (offscreen.js stays, Firefox's background imports it).
    filter: (path) => !/(^|\/)\.[^/]+$/.test(path) && !path.endsWith("offscreen.html") && !/\.test\./.test(path),
  });
  await writeFile(join(OUT, "manifest.json"), JSON.stringify(firefoxManifest(manifest), null, 2) + "\n");
  for (const lang of await readdir(join(OUT, "_locales"))) {
    const file = join(OUT, "_locales", lang, "messages.json");
    const messages = JSON.parse(await readFile(file, "utf8"));
    const short = firefoxName(lang, messages.extName.message);
    if (short !== messages.extName.message) {
      messages.extName.message = short;
      await writeFile(file, JSON.stringify(messages, null, 2) + "\n");
    }
  }

  // The zip is for the store; tests only need the folder (and Windows has no zip command).
  if (process.argv.includes("--no-zip")) {
    console.log("Built dist/firefox/");
  } else {
    const zip = join(ROOT, "dist", `imgkeep-firefox-${manifest.version}.zip`);
    await rm(zip, { force: true });
    execFileSync("zip", ["-r", "-X", "-q", zip, "."], { cwd: OUT });
    console.log(`Built ${zip.replace(ROOT + "/", "")} (unpacked: dist/firefox/)`);
  }
}
