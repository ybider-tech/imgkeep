// Replaces the Firefox listing's screenshots and icon on addons.mozilla.org (AMO API v5), from the brand pack:
//   store/brand-assets-2026/firefox/screenshots/*.png   with their captions from captions.json
//   store/brand-assets-2026/firefox/icon-128.png
// Listing media is not reviewed in advance: --apply changes the public listing straight away.
//
//   node scripts/amo-media.mjs           what's on the listing now and what would change (nothing is sent)
//   node scripts/amo-media.mjs --apply   upload the new screenshots and icon, then remove the old screenshots
//
// Credentials: ~/.config/imgkeep/amo.env (AMO_JWT_ISSUER, AMO_JWT_SECRET), as for amo-publish.mjs. Never printed.
import { createHmac, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PACK = join(ROOT, "store", "brand-assets-2026", "firefox");
const ADDON = "https://addons.mozilla.org/api/v5/addons/addon/imgkeep@imgkeep.app";
const apply = process.argv.includes("--apply");

// Each screenshot's caption: its title and first line, without the pack's production note.
const captions = JSON.parse(await readFile(join(PACK, "captions.json"), "utf8")).map(({ file, title, description }) => ({
  file: join(PACK, "screenshots", file),
  caption: `${title} ${description.split(/(?<=\.) (?=Current Imgkeep|Animated GIF demo)/)[0]}`,
}));
for (const c of captions) if (!existsSync(c.file)) throw new Error(`Missing ${c.file}`);

const now = await fetch(`${ADDON}/?lang=en-US`).then((r) => r.json());
console.log(`Listing now: ${now.previews.length} screenshot(s), icon ${now.icon_url}`);
console.log("Would add:");
for (const [i, c] of captions.entries()) console.log(`  ${i + 1}. ${basename(c.file)}: "${c.caption}"`);
console.log(`  icon: ${join("store", "brand-assets-2026", "firefox", "icon-128.png")}`);
if (now.previews.length) console.log(`Would remove the ${now.previews.length} current screenshot(s).`);
if (!apply) {
  console.log("Nothing sent. Run with --apply to change the public listing.");
  process.exit(0);
}

const envFile = join(homedir(), ".config", "imgkeep", "amo.env");
const env = Object.fromEntries(
  (await readFile(envFile, "utf8")).split("\n").filter((l) => /^\w+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
if (!env.AMO_JWT_ISSUER || !env.AMO_JWT_SECRET) throw new Error("amo.env needs AMO_JWT_ISSUER and AMO_JWT_SECRET");

// AMO's API takes a fresh HS256 JWT on every request (https://mozilla.github.io/addons-server/topics/api/auth.html).
const b64 = (x) => Buffer.from(typeof x === "string" ? x : JSON.stringify(x)).toString("base64url");
function jwt() {
  const iat = Math.floor(Date.now() / 1000);
  const body = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ iss: env.AMO_JWT_ISSUER, jti: randomUUID(), iat, exp: iat + 60 })}`;
  return `${body}.${createHmac("sha256", env.AMO_JWT_SECRET).update(body).digest("base64url")}`;
}
// AMO throttles bursts of writes (HTTP 429, "Expected available in N seconds"): wait and try again.
async function call(method, url, body) {
  for (;;) {
    const res = await send(method, url, body);
    if (res.status !== 429) return res.value;
    const wait = Number(res.text.match(/available in (\d+) second/)?.[1] ?? 60) + 2;
    console.log(`  throttled by AMO, waiting ${wait}s`);
    await new Promise((r) => setTimeout(r, wait * 1000));
  }
}
async function send(method, url, body) {
  const res = await fetch(url, { method, headers: { Authorization: `JWT ${jwt()}`, ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }) }, body: body instanceof FormData || !body ? body : JSON.stringify(body) });
  const text = await res.text();
  if (res.status === 429) return { status: 429, text };
  if (!res.ok) throw new Error(`${method} ${url}: HTTP ${res.status} ${text.slice(0, 300)}`);
  return { status: res.status, value: text ? JSON.parse(text) : null };
}
const png = async (file) => new Blob([await readFile(file)], { type: "image/png" });

// New ones first, so the listing is never without screenshots. A screenshot already on the listing with its
// caption (from a run that stopped part way) is kept as it is, so running --apply again picks up where it stopped.
const captionOf = (p) => p.caption?.["en-US"] ?? (typeof p.caption === "string" ? p.caption : "");
const done = new Set(now.previews.map(captionOf));
for (const [i, c] of captions.entries()) {
  if (done.has(c.caption)) {
    console.log(`Already there: ${basename(c.file)}`);
    continue;
  }
  const form = new FormData();
  form.append("image", await png(c.file), basename(c.file));
  const preview = await call("POST", `${ADDON}/previews/`, form);
  c.id = preview.id;
  console.log(`Uploaded ${basename(c.file)}`);
}
// AMO resizes each upload in the background and, when that finishes, saves the screenshot again without the
// caption or position given in the meantime (seen 2026-11-10). So set them once processing is done, check, repeat.
for (let round = 1; ; round++) {
  await new Promise((r) => setTimeout(r, 30_000));
  const listed = (await call("GET", `${ADDON}/?lang=en-US`)).previews;
  const wrong = captions.map((c, i) => ({ ...c, position: i + 1, preview: c.id ? listed.find((p) => p.id === c.id) : listed.find((p) => captionOf(p) === c.caption) }))
    .filter((c) => c.preview && (c.preview.position !== c.position || captionOf(c.preview) !== c.caption));
  if (!wrong.length) break;
  if (round > 4) throw new Error(`Captions didn't stick on ${wrong.map((c) => basename(c.file)).join(", ")}`);
  for (const c of wrong) await call("PATCH", `${ADDON}/previews/${c.preview.id}/`, { caption: { "en-US": c.caption }, position: c.position });
}
console.log("Captions and order checked.");
for (const old of now.previews.filter((p) => !captions.some((c) => c.caption === captionOf(p)))) {
  await call("DELETE", `${ADDON}/previews/${old.id}/`);
  console.log(`Removed old screenshot ${old.id}`);
}
const iconForm = new FormData();
iconForm.append("icon", await png(join(PACK, "icon-128.png")), "icon-128.png");
await call("PATCH", `${ADDON}/`, iconForm);
console.log("Icon replaced. Done: https://addons.mozilla.org/firefox/addon/imgkeep/");
