// The rating ask and the "New" labels in the right-click menu.
// Everything here is counted on this computer, in chrome.storage.local, and never sent anywhere.
// Pure functions (no chrome.* at import time) so tests can import this file in Node.

export const DAY = 24 * 60 * 60 * 1000;

// When Imgkeep asks for a rating: after real use, never during a failure streak, and at most three times
// (once until 0.15.1). "Rate Imgkeep" or "Don't ask again" ends it for good; "Later", or a round left
// unanswered, asks again after more use, up to maxRounds.
export const REVIEW = {
  minUses: 5, // successful saves and copies (15 until 0.12.1, 10 in the first 0.12.1 build)
  minDays: 2, // since install, or since the update that added this for existing users (7 until 0.12.1, 5 in the first 0.12.1 build)
  cleanStreak: 3, // the last few saves all worked
  menuDays: 14, // how long the "Rate it" menu item stays in a round that's never answered
  maxRounds: 3, // asks in all (since 0.15.1)
  againUses: 20, // more successful saves and copies before the next round
  againDays: 7, // and at least this long after the last one
};

export const REVIEW_URLS = {
  chrome: "https://chromewebstore.google.com/detail/fkclfgbmjaafglfifenonfcahfdmajbl/reviews",
  edge: "https://microsoftedge.microsoft.com/addons/detail/kokbmagcbobpjclpidebikeklmpafhhd",
  firefox: "https://addons.mozilla.org/firefox/addon/imgkeep/reviews/",
};

// Edge identifies itself with "Edg/" in its user agent, Firefox with "Firefox/".
export const storeFor = (userAgent = "") => (/\bEdg\//.test(userAgent) ? "edge" : /\bFirefox\//.test(userAgent) ? "firefox" : "chrome");
export const reviewUrl = (userAgent) => REVIEW_URLS[storeFor(userAgent)];

// usage: { firstSeen, uses, recent: [true, false, …], ask, askedAt, windowAsked, menuShown, round, laterAt, laterUses, answer }
//   ask: "waiting" → "asking" (shown: the menu item for up to menuDays, and one window) → "done" (rated, declined,
//   or out of rounds). "Later", or a round left unanswered, goes back to "waiting" for the next round.
//   round: 1 for the first ask (absent in copies from before 0.15.1); laterAt/laterUses: when the last round ended.
//   answer: "rate", "no" or "rounds" (since 0.15.1; older copies that finished have no answer and stay done).
export function newUsage(now) {
  return { firstSeen: now, uses: 0, recent: [], ask: "waiting" };
}

export function recordUse(usage, ok) {
  const recent = [...(usage.recent || []), ok].slice(-REVIEW.cleanStreak);
  return { ...usage, uses: (usage.uses || 0) + (ok ? 1 : 0), recent };
}

export const roundOf = (usage) => usage?.round || 1;

// Has the moment come? Enough real use, for long enough, and the last few saves worked. A later round needs
// againUses more saves and againDays since the last one ended.
export function readyToAsk(usage, now) {
  if (!usage || usage.ask !== "waiting") return false;
  const recent = usage.recent || [];
  const used =
    roundOf(usage) === 1
      ? usage.uses >= REVIEW.minUses && now - usage.firstSeen >= REVIEW.minDays * DAY
      : usage.uses >= (usage.laterUses || 0) + REVIEW.againUses && now - (usage.laterAt || 0) >= REVIEW.againDays * DAY;
  return used && recent.length >= REVIEW.cleanStreak && recent.every(Boolean);
}

// The ask is open: it started (askedAt) less than menuDays ago and hasn't been answered.
const asking = (usage, now) => usage?.ask === "asking" && now - usage.askedAt < REVIEW.menuDays * DAY;

export const markAsked = (usage, now) => (usage.ask === "asking" ? usage : { ...usage, ask: "asking", askedAt: now });

// The "Rate it" menu item: from the moment it's ready until answered, for menuDays at most.
export const menuAskVisible = (usage, now) => readyToAsk(usage, now) || asking(usage, now);

// In a window (after a copy or a save in More options, or on its own after a quick save from the menu): once a round.
export const windowCanAsk = (usage, now) => (readyToAsk(usage, now) || asking(usage, now)) && !usage.windowAsked;
export const markWindowAsked = (usage, now) => ({ ...markAsked(usage, now), windowAsked: true });

// Left unanswered for menuDays: that round is over (like "Later").
export const askExpired = (usage, now) => usage?.ask === "asking" && !asking(usage, now);

// "Rate Imgkeep" or "Don't ask again": done for good.
export const finishAsk = (usage, answer) => ({ ...usage, ask: "done", ...(answer ? { answer } : {}) });

// "Later", or a round left unanswered: the next round after more use, or done after the last one.
export function laterAsk(usage, now) {
  if (roundOf(usage) >= REVIEW.maxRounds) return finishAsk(usage, "rounds");
  const { askedAt, windowAsked, menuShown, ...rest } = usage;
  return { ...rest, ask: "waiting", round: roundOf(usage) + 1, laterAt: now, laterUses: usage.uses || 0 };
}

// ---- "New" in the right-click menu ----

// The version that added each menu item.
export const MENU_SINCE = { "imgkeep-pdf": "0.5.0", "imgkeep-copy": "0.6.0", "imgkeep-more": "0.6.0", "imgkeep-palette": "0.11.0" };
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
