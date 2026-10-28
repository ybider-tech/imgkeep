// Anonymous counts for imgkeep.app: which pages are visited, and which pages send people to the stores.
// Events sent straight to PostHog (EU cloud) with one request each; no PostHog library.
//   site_pageview     the page's path, and the referring site's name only (e.g. "google.com")
//   site_store_click  the page's path, which store (chrome, edge or firefox), and the link's utm_campaign
//   site_convert      on the Free Image Converter: the format pair and how many files (e.g. webp → jpg, 3)
// Each event also says the kind of device: "mobile", "tablet" or "desktop", worked out here; the browser's
// details never leave the page.
// No cookies, no local storage, a new random id for every event, no person profile, no location lookup;
// the PostHog project discards IP addresses. Nothing is sent when the browser asks sites not to track
// (Global Privacy Control or Do Not Track), or anywhere but imgkeep.app.
(() => {
  const URL = "https://eu.i.posthog.com/i/v0/e/";
  const KEY = "phc_ySndSqiXPjvRPLoBmrGW96UsQQUGrGk5qCGKjneucWk2"; // public: it can only send events
  if (!/^(www\.)?imgkeep\.app$/.test(location.hostname)) return;
  if (navigator.globalPrivacyControl === true || navigator.doNotTrack === "1") return;

  // Only the kind of device, so we know how many visitors are on phones. iPads say "Macintosh" but have touch.
  const ua = navigator.userAgent;
  const device =
    /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
      ? "tablet"
      : /Mobi|iPhone|iPod|Android/i.test(ua)
        ? "mobile"
        : "desktop";

  const randomId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}${Math.random()}`.replace(".", ""));
  const send = (event, props) =>
    fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      keepalive: true, // still sent when the click leaves the page
      body: JSON.stringify({
        api_key: KEY,
        event,
        distinct_id: randomId(),
        timestamp: new Date().toISOString(),
        properties: {
          ...props,
          path: location.pathname,
          device,
          $process_person_profile: false,
          $geoip_disable: true,
          $lib: "imgkeep-site",
        },
      }),
    }).catch(() => {});

  // The referring site's name, never its full address; nothing when it's this site or unknown.
  let referrer = "";
  try {
    const host = new window.URL(document.referrer).hostname.replace(/^www\./, "");
    if (host && host !== location.hostname.replace(/^www\./, "")) referrer = host;
  } catch {}
  send("site_pageview", { referrer });

  // Called by the converter (site/convert/app.js) after a batch: only the formats and the number of files.
  // "clipboard": Copy as PNG on a converted image.
  const FORMATS = ["png", "jpg", "jpeg", "webp", "avif", "gif", "svg", "bmp", "ico", "pdf", "tiff", "heic", "clipboard", "other"];
  window.imgkeepCountConversion = (from, to, files) => {
    const pick = (f) => (FORMATS.includes(f) ? f : "other");
    const n = Math.min(Math.max(1, Math.floor(Number(files)) || 1), 100);
    send("site_convert", { from: pick(from), to: pick(to), files: n });
  };

  document.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest?.(
        'a[href^="https://chromewebstore.google.com/"], a[href^="https://microsoftedge.microsoft.com/addons/"], a[href^="https://addons.mozilla.org/"]',
      );
      if (!a) return;
      const link = new window.URL(a.href);
      send("site_store_click", {
        store: link.hostname.startsWith("chromewebstore") ? "chrome" : link.hostname === "addons.mozilla.org" ? "firefox" : "edge",
        campaign: link.searchParams.get("utm_campaign") || "",
      });
    },
    { capture: true },
  );
})();
