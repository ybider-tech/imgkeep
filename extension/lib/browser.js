// The few things Firefox does differently from Chrome and Edge. Feature checks live here, in one place.
//   - Conversion: Chrome and Edge convert in an offscreen document (their service worker has no DOM).
//     Firefox's background is a page with a DOM, so it runs offscreen.js itself.
//   - "A folder you choose" needs the File System Access API, which Firefox doesn't have: Downloads or ask.
//   - The anonymous daily summary: Firefox asks at install whether to allow "technical and interaction data"
//     (off unless the user turns it on); Imgkeep sends nothing on Firefox without that permission.
//   - Each browser keeps extensions away from its own add-on store, images included (Firefox: Mozilla's
//     extensions.webextensions.restrictedDomains). A blocked image there gets its own message, not the site question.

export const IS_FIREFOX = typeof navigator !== "undefined" && /\bFirefox\//.test(navigator.userAgent);
export const FOLDERS = !IS_FIREFOX;
export const COUNTS_CONSENT = { data_collection: ["technicalAndInteraction"] };

// Has the user allowed the summary in the browser itself? Always true on Chrome and Edge, which don't ask.
export async function countsAllowed() {
  if (!IS_FIREFOX) return true;
  return chrome.permissions.contains(COUNTS_CONSENT).catch(() => false);
}

// The add-on stores' sites (and Mozilla's other protected sites), where a blocked image is the browser's doing.
const STORE_HOSTS = [
  "chromewebstore.google.com",
  "chrome.google.com",
  "microsoftedge.microsoft.com",
  "addons.mozilla.org",
  "addons.cdn.mozilla.net",
  "discovery.addons.mozilla.org",
  "install.mozilla.org",
  "support.mozilla.org",
  "accounts.firefox.com",
];
export function isStoreSite(url) {
  try {
    return STORE_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}
