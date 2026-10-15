// Anonymous daily usage counts (on by default; one click off in Options).
//
// What is counted: how many saves worked per format and save mode, how many failed and why (an error
// code), copies, More options, site-access and rating answers, saves made smaller by the maximum
// width, and for each conversion the original image's format and the one it became (webp_to_jpg). Counted on this computer, then sent once a day as ONE summary of the previous active day.
// Never: image or page addresses, site or file names, folder names, settings text, or any identifier.
//
// Sent to PostHog (open source, EU cloud, https://posthog.com) with one direct request, as an anonymous
// event: a new random id each time and no person profile. The project discards client IP addresses.
// This file and offscreen.js (which fetches the image you chose) are the only places that may make a
// network request, and this one may only call ANALYTICS.url. tests/static-check.mjs enforces both.
// (Until 0.8.1 the summary went to Aptabase.)

export const ANALYTICS = {
  url: "https://eu.i.posthog.com/i/v0/e/",
  // The Imgkeep project's public key in PostHog (EU). Not a secret: it only allows sending events.
  appKey: "phc_ySndSqiXPjvRPLoBmrGW96UsQQUGrGk5qCGKjneucWk2",
};

// Every count that can be sent. Anything else is dropped before sending.
const FORMATS = ["png", "jpg", "webp", "gif", "pdf", "ico", "bmp", "original"];
const MODES = ["downloads", "folder", "ask"];
const FAILURES = ["blocked", "http", "decode", "unsupported", "blob", "too_large", "timeout", "download", "write", "expired", "unknown", "copy"];
// Conversions: the original image's format (from its bytes) → the format it was saved as.
const SOURCES = ["jpg", "png", "webp", "avif", "gif", "svg", "bmp", "ico", "other"];
const TARGETS = FORMATS.filter((f) => f !== "original");
export const COUNT_KEYS = [
  ...FORMATS.map((f) => `save_${f}`),
  ...SOURCES.flatMap((s) => TARGETS.map((t) => `${s}_to_${t}`)),
  ...MODES.map((m) => `mode_${m}`),
  ...FAILURES.map((f) => `fail_${f}`),
  "resized", // a save made smaller by the maximum width
  "last_used", // a save from the "last used" item at the top of the menu
  "find_enabled", // Find image here was turned on
  "find_found", // Find image here found the image under the right-click
  "find_picker", // Find image here showed a list of the images on screen
  "find_nothing", // Find image here found no image
  "copy",
  "more_options",
  "more_options_save",
  "site_access_asked",
  "site_access_allowed",
  "folder_asked",
  "rating_asked",
  "rating_rate",
  "rating_no",
];

// "image/webp" → "webp"; anything not listed → "other".
const SOURCE_BY_TYPE = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/apng": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};
export const conversionKey = (sourceType, format) =>
  TARGETS.includes(format) ? `${SOURCE_BY_TYPE[String(sourceType || "").toLowerCase()] || "other"}_to_${format}` : null;

export const failureKey = (code) => {
  const key = `fail_${String(code || "unknown").replace(/-/g, "_")}`;
  return COUNT_KEYS.includes(key) ? key : "fail_unknown";
};

// The local calendar day, "2026-10-08".
export function dayOf(now = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// counts: { day, c: { save_png: 3, … } }
export function addCount(counts, key, day) {
  if (!COUNT_KEYS.includes(key)) return counts;
  const base = counts?.day === day ? counts : { day, c: {} };
  return { day, c: { ...base.c, [key]: (base.c[key] || 0) + 1 } };
}

// A finished day's counts become the summary to send; today's keep counting.
export const dayIsOver = (counts, day) => Boolean(counts?.day && counts.day !== day && Object.keys(counts.c || {}).length);

// The props of one summary: known counts (whole numbers) plus the browser. Nothing else gets through.
export function summaryProps(c, browser) {
  const props = {};
  for (const key of COUNT_KEYS) {
    const n = Math.floor(Number(c?.[key]));
    if (n > 0) props[key] = n;
  }
  props.browser = browser === "edge" ? "edge" : "chrome";
  return props;
}

// A fresh random id for every summary, so summaries can't be linked to each other.
export function randomSessionId(now = Date.now()) {
  return `${Math.floor(now / 1000)}${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`;
}

// PostHog's event format. $process_person_profile: false makes it an anonymous event: PostHog keeps no
// person for it. $geoip_disable: true stops it from looking up a location from the IP address. debug marks copies loaded unpacked (development, testing), so dashboards can leave them out.
export function summaryEvent(props, { appVersion, locale, now = new Date(), isDebug = false }) {
  return {
    event: "daily_counts",
    distinct_id: randomSessionId(now.getTime()),
    timestamp: now.toISOString(),
    properties: {
      ...props,
      app_version: appVersion,
      locale,
      debug: isDebug,
      $process_person_profile: false,
      $geoip_disable: true, // no location lookup at all (country, city…) from the request's IP address
      $lib: "imgkeep-direct",
    },
  };
}

// Sends one summary. Returns true if PostHog accepted it. Never throws.
export async function sendSummary(event, appKey = ANALYTICS.appKey) {
  if (!appKey) return false;
  try {
    const res = await fetch(ANALYTICS.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify({ api_key: appKey, ...event }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
