// Anonymous counts for imgkeep.app: which pages are visited, and which pages send people to the stores.
// Two events, sent straight to PostHog (EU cloud) with one request each; no PostHog library.
//   site_pageview     the page's path, and the referring site's name only (e.g. "google.com")
//   site_store_click  the page's path, which store (chrome or edge), and the link's utm_campaign
// No cookies, no local storage, a new random id for every event, no person profile, no location lookup;
// the PostHog project discards IP addresses. Nothing is sent when the browser asks sites not to track
// (Global Privacy Control or Do Not Track), or anywhere but imgkeep.app.
(() => {
  const URL = "https://eu.i.posthog.com/i/v0/e/";
  const KEY = "phc_ySndSqiXPjvRPLoBmrGW96UsQQUGrGk5qCGKjneucWk2"; // public: it can only send events
  if (!/^(www\.)?imgkeep\.app$/.test(location.hostname)) return;
  if (navigator.globalPrivacyControl === true || navigator.doNotTrack === "1") return;

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

  document.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest?.('a[href^="https://chromewebstore.google.com/"], a[href^="https://microsoftedge.microsoft.com/addons/"]');
      if (!a) return;
      const link = new window.URL(a.href);
      send("site_store_click", {
        store: link.hostname.startsWith("chromewebstore") ? "chrome" : "edge",
        campaign: link.searchParams.get("utm_campaign") || "",
      });
    },
    { capture: true },
  );
})();
