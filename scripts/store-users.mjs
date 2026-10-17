// Reads how many users each store reports for Imgkeep and sends the numbers to PostHog as one
// "store_users" event, so the dashboards can show total installs (run once a day by a scheduled task).
//   Chrome Web Store: the "N users" on the public listing (installed and enabled, roughly the last week).
//   Edge Add-ons: activeInstallCount from the public product details.
// This is the store's own count about Imgkeep, not data about any user. Prints the numbers it sent.
const CHROME = "https://chromewebstore.google.com/detail/fkclfgbmjaafglfifenonfcahfdmajbl?hl=en";
const EDGE = "https://microsoftedge.microsoft.com/addons/getproductdetailsbycrxid/kokbmagcbobpjclpidebikeklmpafhhd";
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

const [chrome, edge] = await Promise.all([chromeUsers(), edgeUsers()]);
const res = await fetch(POSTHOG, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    api_key: KEY,
    event: "store_users",
    distinct_id: "imgkeep-stores", // one fixed id: these are store totals, not a person
    timestamp: new Date().toISOString(),
    properties: { chrome_users: chrome, edge_users: edge, total_users: chrome + edge, $process_person_profile: false, $lib: "imgkeep-store-users" },
  }),
});
if (!res.ok) throw new Error(`PostHog answered ${res.status}`);
console.log(`store_users sent: Chrome ${chrome}, Edge ${edge}, total ${chrome + edge}`);
