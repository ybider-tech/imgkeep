// The page the browser opens after someone removes Imgkeep: a short, optional Google Form asking why
// (two questions, no email collected). Imgkeep only registers the address; it sends nothing itself.
// The form's address carries just the version, so answers can be grouped by release.
// Pure helpers (no chrome.* at import time) so tests can import this file in Node.

export const UNINSTALL_FORM = "https://docs.google.com/forms/d/e/1FAIpQLSfC9O-KMngfyRF6yA7BMdxHgmHRSZBIDJdHeF886wsq_8aT6w/viewform";
const VERSION_FIELD = "entry.1734858481";

export function uninstallUrl(version) {
  const v = /^\d+(\.\d+){0,3}$/.test(String(version)) ? String(version) : "";
  // hl=en: the form is in English, so Google's own interface matches it (otherwise it may switch to
  // right to left for some locations, around English questions).
  return `${UNINSTALL_FORM}?usp=pp_url&hl=en&${VERSION_FIELD}=${encodeURIComponent(v)}`;
}
