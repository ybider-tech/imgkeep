// Reads how many users each store reports for Imgkeep and sends the numbers to PostHog as one
// "store_users" event, so the dashboards can show total installs (run once a day by a scheduled task).
//   Chrome Web Store: the "N users" on the public listing (installed and enabled, roughly the last week).
//   Edge Add-ons: activeInstallCount from the public product details.
//   Firefox Add-ons: average_daily_users from the public AMO API (0 until the add-on is listed).
// This is the store's own count about Imgkeep, not data about any user. Prints the numbers it sent.
const CHROME = "https://chromewebstore.google.com/detail/fkclfgbmjaafglfifenonfcahfdmajbl?hl=en";
const EDGE = "https://microsoftedge.microsoft.com/addons/getproductdetailsbycrxid/kokbmagcbobpjclpidebikeklmpafhhd";
const FIREFOX = "https://addons.mozilla.org/api/v5/addons/addon/imgkeep@imgkeep.app/";
const POSTHOG = "https://eu.i.posthog.com/i/v0/e/";
const KEY = "phc_ySndSqiXPjvRPLoBmrGW96UsQQUGrGk5qCGKjneucWk2"; // public project key: can only send events

async function chromeUsers() {
  const html = await (await fetch(CHROME, { headers: { "Accept-Language": "en" } })).text();
  const m = html.match(/([\d,]+)\+?\s+users/);
  if (!m) throw new Error("no user count on the Chrome Web Store page");
  return Number(m[1].replace(/,/g, ""));
}

async function edgeUsers() {
  const n = (await (await fetch(EDGE)).json()).activeInstallCount;
  if (!Number.isFinite(n)) throw new Error("no activeInstallCount from Edge Add-ons");
  return n;
}

// Not listed yet (or still in review): AMO answers 401/404, which counts as 0.
async function firefoxUsers() {
  const res = await fetch(FIREFOX);
  if (res.status === 401 || res.status === 404) return 0;
  const n = (await res.json()).average_daily_users;
  if (!Number.isFinite(n)) throw new Error("no average_daily_users from addons.mozilla.org");
  return n;
}

const [chrome, edge, firefox] = await Promise.all([chromeUsers(), edgeUsers(), firefoxUsers()]);
const res = await fetch(POSTHOG, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    api_key: KEY,
    event: "store_users",
    distinct_id: "imgkeep-stores", // one fixed id: these are store totals, not a person
    timestamp: new Date().toISOString(),
    properties: { chrome_users: chrome, edge_users: edge, firefox_users: firefox, total_users: chrome + edge + firefox, $process_person_profile: false, $geoip_disable: true, $lib: "imgkeep-store-users" },
  }),
});
if (!res.ok) throw new Error(`PostHog answered ${res.status}`);
console.log(`store_users sent: Chrome ${chrome}, Edge ${edge}, Firefox ${firefox}, total ${chrome + edge + firefox}`);
