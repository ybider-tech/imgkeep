// Anonymous daily usage counts (on by default; one click off in Options).
//
// What is counted: how many saves worked per format and save mode, how many failed and why (an error
// code), copies, More options, site-access and rating answers, and saves made smaller by the maximum
// width. Counted on this computer, then sent once a day as ONE summary of the previous active day.
// Never: image or page addresses, site or file names, folder names, settings text, or any identifier.
//
// Sent to Aptabase (open source, EU-hosted, https://aptabase.com) with one direct request. This file and
// offscreen.js (which fetches the image you chose) are the only places that may make a network request,
// and this one may only call APTABASE.url. tests/static-check.mjs enforces both.

export const APTABASE = {
  url: "https://eu.aptabase.com/api/v0/event",
  // The Imgkeep app's key in Aptabase (EU region). Not a secret: it only allows sending events.
  appKey: "A-EU-2150018612",
};

// Every count that can be sent. Anything else is dropped before sending.
const FORMATS = ["png", "jpg", "webp", "gif", "pdf", "original"];
const MODES = ["downloads", "folder", "ask"];
const FAILURES = ["blocked", "http", "decode", "unsupported", "blob", "too_large", "timeout", "download", "write", "expired", "unknown", "copy"];
export const COUNT_KEYS = [
  ...FORMATS.map((f) => `save_${f}`),
  ...MODES.map((m) => `mode_${m}`),
  ...FAILURES.map((f) => `fail_${f}`),
  "resized", // a save made smaller by the maximum width
  "last_used", // a save from the "last used" item at the top of the menu
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

// A fresh random session id for every summary, so summaries can't be linked to each other.
export function randomSessionId(now = Date.now()) {
  return `${Math.floor(now / 1000)}${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`;
}

// Aptabase's event format (the same one its own SDK sends).
export function summaryEvent(props, { appVersion, locale, now = new Date(), isDebug = false }) {
  return {
    timestamp: now.toISOString(),
    sessionId: randomSessionId(now.getTime()),
    eventName: "daily_counts",
    systemProps: { locale, isDebug, appVersion, sdkVersion: "imgkeep-direct@1" },
    props,
  };
}

// Sends one summary. Returns true if Aptabase accepted it. Never throws.
export async function sendSummary(event, appKey = APTABASE.appKey) {
  if (!appKey) return false;
  try {
    const res = await fetch(APTABASE.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "App-Key": appKey },
      credentials: "omit",
      body: JSON.stringify(event),
    });
    return res.ok;
  } catch {
    return false;
  }
}
