// The one-time rating ask and the "New" labels in the right-click menu.
// Everything here is counted on this computer, in chrome.storage.local, and never sent anywhere.
// Pure functions (no chrome.* at import time) so tests can import this file in Node.

export const DAY = 24 * 60 * 60 * 1000;

// When Imgkeep asks for a rating: after real use, once, and never during a failure streak.
export const REVIEW = {
  minUses: 15, // successful saves and copies
  minDays: 7, // since install (or since the update that added this, for existing users)
  cleanStreak: 3, // the last few saves all worked
  menuDays: 14, // how long the "Rate it" menu item stays if it's never answered
};

export const REVIEW_URLS = {
  chrome: "https://chromewebstore.google.com/detail/fkclfgbmjaafglfifenonfcahfdmajbl/reviews",
  edge: "https://microsoftedge.microsoft.com/addons/detail/kokbmagcbobpjclpidebikeklmpafhhd",
};

// Edge identifies itself with "Edg/" in its user agent.
export const storeFor = (userAgent = "") => (/\bEdg\//.test(userAgent) ? "edge" : "chrome");
export const reviewUrl = (userAgent) => REVIEW_URLS[storeFor(userAgent)];

// usage: { firstSeen, uses, recent: [true, false, …], ask, askedAt, windowAsked }
//   ask: "waiting" → "asking" (shown: the menu item for up to menuDays, and one window) → "done" (answered or expired)
export function newUsage(now) {
  return { firstSeen: now, uses: 0, recent: [], ask: "waiting" };
}

export function recordUse(usage, ok) {
  const recent = [...(usage.recent || []), ok].slice(-REVIEW.cleanStreak);
  return { ...usage, uses: (usage.uses || 0) + (ok ? 1 : 0), recent };
}

// Has the moment come? Enough real use, for long enough, and the last few saves worked.
export function readyToAsk(usage, now) {
  if (!usage || usage.ask !== "waiting") return false;
  const recent = usage.recent || [];
  return (
    usage.uses >= REVIEW.minUses &&
    now - usage.firstSeen >= REVIEW.minDays * DAY &&
    recent.length >= REVIEW.cleanStreak &&
    recent.every(Boolean)
  );
}

// The ask is open: it started (askedAt) less than menuDays ago and hasn't been answered.
const asking = (usage, now) => usage?.ask === "asking" && now - usage.askedAt < REVIEW.menuDays * DAY;

export const markAsked = (usage, now) => (usage.ask === "asking" ? usage : { ...usage, ask: "asking", askedAt: now });

// The "Rate it" menu item: from the moment it's ready until answered, for menuDays at most.
export const menuAskVisible = (usage, now) => readyToAsk(usage, now) || asking(usage, now);

// In a window (after a copy or a save in More options): only once, ever.
export const windowCanAsk = (usage, now) => (readyToAsk(usage, now) || asking(usage, now)) && !usage.windowAsked;
export const markWindowAsked = (usage, now) => ({ ...markAsked(usage, now), windowAsked: true });

// Left unanswered for menuDays: that was the one ask.
export const askExpired = (usage, now) => usage?.ask === "asking" && !asking(usage, now);

// Answered ("rate" or "no"), or expired: done for good.
export const finishAsk = (usage) => ({ ...usage, ask: "done" });

// ---- "New" in the right-click menu ----

// The version that added each menu item.
export const MENU_SINCE = { "imgkeep-pdf": "0.5.0", "imgkeep-copy": "0.6.0", "imgkeep-more": "0.6.0" };
export const NEW_DAYS = 30;

export function compareVersions(a, b) {
  const pa = String(a).split(".").map(Number);
  const pb = String(b).split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return Math.sign(d);
  }
  return 0;
}

// Menu items added after the version someone updated from.
export const newItemsSince = (previousVersion) =>
  Object.keys(MENU_SINCE).filter((id) => compareVersions(MENU_SINCE[id], previousVersion) > 0);
