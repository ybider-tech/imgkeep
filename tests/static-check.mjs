// Static trust check. Fails if the extension asks for more than it should, makes network calls
// anywhere but the two allowed places, or references outside URLs.
//   offscreen.js      fetches the image you chose (and nothing else is fetched there by design)
//   lib/telemetry.js  sends the anonymous daily summary, to exactly one PostHog URL
// One compiled part: the AVIF encoder in vendor/avif (since 0.10.0), pinned to exact bytes below and loaded
// by offscreen.js, which hands it the .wasm file from inside the extension, so its loader never fetches.
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const EXT = join(dirname(fileURLToPath(import.meta.url)), "..", "extension");
const ALLOWED_PERMISSIONS = ["contextMenus", "downloads", "offscreen", "storage"];
const ALLOWED_OPTIONAL_HOSTS = ["http://*/*", "https://*/*"];
// imgkeep.app and the two stores (for "Rate Imgkeep"). These are links people click, never requests the extension makes.
const ALLOWED_URL = /^https?:\/\/((www\.)?imgkeep\.app|chromewebstore\.google\.com|chrome\.google\.com\/webstore|microsoftedge\.microsoft\.com\/addons|posthog\.com)(\/|$)|^https:\/\/eu\.i\.posthog\.com\/i\/v0\/e\/$|^https:\/\/docs\.google\.com\/forms\/d\/e\/1FAIpQLSfC9O-KMngfyRF6yA7BMdxHgmHRSZBIDJdHeF886wsq_8aT6w\/viewform$/;
// The uninstall form (lib/uninstall.js) is the one Google address allowed: the browser opens it after an
// uninstall; the extension never requests it.
const FETCH_FILES = ["offscreen.js", "lib/telemetry.js"];
const TELEMETRY_URL = "https://eu.i.posthog.com/i/v0/e/";
const TEXT_FILES = /\.(js|mjs|html|css|json|md|txt)$/

const problems = [];
const fail = (msg) => problems.push(msg);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

// The vendored AVIF encoder: @jsquash/avif 2.1.1 (libavif 1.0.1 + libaom), unchanged. Its loader is generic
// Emscripten code (it mentions fetch, XMLHttpRequest and importScripts for other environments), so instead of
// scanning its text, its exact bytes are pinned. Updating it means updating these hashes on purpose.
const VENDOR = {
  "vendor/avif/avif_enc.js": "c6805e62cae5c1b9870fcc0448437da9e4edfc58c3da264af52361281082c63c",
  "vendor/avif/avif_enc.wasm": "d9f2a95164362af48558d176e619becfd49dd97b50b86c679b47100860522b3d",
};
const VENDOR_NOTICES = ["vendor/avif/LICENSE-jsquash", "vendor/avif/LICENSE-libavif", "vendor/avif/LICENSE-libaom", "vendor/avif/PATENTS-libaom", "vendor/avif/README"];
// WebAssembly is allowed (for that encoder), nothing else: no remote sources, no eval.
const ALLOWED_CSP = "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'";

// Manifest
const manifest = JSON.parse(await readFile(join(EXT, "manifest.json"), "utf8"));
const perms = [...(manifest.permissions || [])].sort();
if (JSON.stringify(perms) !== JSON.stringify(ALLOWED_PERMISSIONS)) {
  fail(`manifest permissions must be exactly ${ALLOWED_PERMISSIONS.join(", ")}; found ${perms.join(", ")}`);
}
for (const key of ["host_permissions", "content_scripts", "externally_connectable", "web_accessible_resources"]) {
  if (key in manifest) fail(`manifest must not declare ${key}`);
}
const optional = [...(manifest.optional_host_permissions || [])].sort();
if (JSON.stringify(optional) !== JSON.stringify(ALLOWED_OPTIONAL_HOSTS)) {
  fail(`optional_host_permissions must be exactly ${ALLOWED_OPTIONAL_HOSTS.join(", ")}`);
}
// "Find image here" only: off until the user turns it on, and neither comes with an install warning.
const ALLOWED_OPTIONAL = ["activeTab", "scripting"];
if (JSON.stringify([...(manifest.optional_permissions || [])].sort()) !== JSON.stringify(ALLOWED_OPTIONAL)) {
  fail(`optional_permissions must be exactly ${ALLOWED_OPTIONAL.join(", ")}`);
}
if (manifest.manifest_version !== 3) fail("manifest_version must be 3");
if (JSON.stringify(manifest.content_security_policy) !== JSON.stringify({ extension_pages: ALLOWED_CSP })) {
  fail(`content_security_policy must be exactly { extension_pages: "${ALLOWED_CSP}" }`);
}
if (JSON.stringify(manifest).includes("<all_urls>")) fail("manifest must not mention <all_urls>");
if (manifest.description.length > 132) fail("description is longer than 132 characters");

// Files
const vendorSeen = new Set();
for await (const path of walk(EXT)) {
  const rel = relative(EXT, path);
  const relPath = rel.split("\\").join("/");
  if (relPath.startsWith("vendor/")) {
    vendorSeen.add(relPath);
    if (VENDOR[relPath]) {
      const hash = createHash("sha256").update(await readFile(path)).digest("hex");
      if (hash !== VENDOR[relPath]) fail(`${relPath}: changed (sha256 ${hash}); vendored code must match the pinned bytes`);
    } else if (!VENDOR_NOTICES.includes(relPath)) {
      fail(`${relPath}: unexpected file in vendor/`);
    }
    continue;
  }
  if (path.endsWith(".wasm")) fail(`${rel}: WebAssembly is only allowed in vendor/avif`);
  if (!TEXT_FILES.test(path)) continue;
  let text = await readFile(path, "utf8");
  if (rel === "manifest.json") {
    for (const p of ALLOWED_OPTIONAL_HOSTS) text = text.replaceAll(`"${p}"`, '""');
  }
  const relPosix = rel.split("\\").join("/");
  if (/\bfetch\s*\(/.test(text) && !FETCH_FILES.includes(relPosix)) fail(`${rel}: fetch( is only allowed in ${FETCH_FILES.join(" and ")}`);
  if (/posthog\.com/i.test(text) && relPosix !== "lib/telemetry.js" && !rel.startsWith("_locales") && rel !== "PRIVACY.md") {
    fail(`${rel}: only lib/telemetry.js may talk to PostHog`);
  }
  for (const [url] of text.matchAll(/https?:\/\/[^\s"'`<>)\]]*/g)) {
    if (!ALLOWED_URL.test(url)) fail(`${rel}: outside URL ${url}`);
  }
  if (/\b(eval|new Function)\s*\(/.test(text)) fail(`${rel}: eval/new Function is not allowed`);
  if (/chrome\.scripting\./.test(text) && relPosix !== "background.js") fail(`${rel}: only background.js may use chrome.scripting`);
  if (/\bimportScripts\s*\(|\bimport\s*\(\s*["'`]https?:/.test(text)) fail(`${rel}: remote code is not allowed`);
}

for (const file of [...Object.keys(VENDOR), ...VENDOR_NOTICES]) if (!vendorSeen.has(file)) fail(`${file}: missing`);
// Only offscreen.js may load the encoder.
for await (const path of walk(EXT)) {
  const rel = relative(EXT, path).split("\\").join("/");
  if (rel.startsWith("vendor/") || !/\.(js|mjs|html)$/.test(rel)) continue;
  const loads = /(\bimport\s*\(|\bfrom\s+|getURL\s*\()\s*["'`][^"'`]*vendor\//.test(await readFile(path, "utf8"));
  if (loads && rel !== "offscreen.js") fail(`${rel}: only offscreen.js may load vendored code`);
}

// The summary goes to exactly one address, with exactly one request.
const telemetry = await readFile(join(EXT, "lib", "telemetry.js"), "utf8");
if ((telemetry.match(/\bfetch\s*\(/g) || []).length !== 1) fail("lib/telemetry.js must make exactly one fetch(");
if (!telemetry.includes(`url: "${TELEMETRY_URL}"`)) fail(`lib/telemetry.js must send only to ${TELEMETRY_URL}`);
if (!/fetch\(ANALYTICS\.url,/.test(telemetry)) fail("lib/telemetry.js must fetch ANALYTICS.url and nothing else");

// Translations (_locales): same messages everywhere, placeholders and tokens kept, store limits respected.
const LOCALES = join(EXT, "_locales");
const en = JSON.parse(await readFile(join(LOCALES, "en", "messages.json"), "utf8"));
const enKeys = Object.keys(en).sort();
const tags = (s) => (s.match(/<\/?[a-z]+>/gi) || []).sort().join(" ");
const tokens = (s) => (s.match(/\{(name|host|date|time|w|h)\}/g) || []).sort().join(" ");
const placeholders = (s) => (s.match(/\$[A-Z_]+\$/gi) || []).map((p) => p.toUpperCase()).sort().join(" ");
if (manifest.default_locale !== "en") fail("manifest default_locale must be en");
for (const lang of await readdir(LOCALES)) {
  const file = `_locales/${lang}/messages.json`;
  let msgs;
  try {
    msgs = JSON.parse(await readFile(join(LOCALES, lang, "messages.json"), "utf8"));
  } catch (e) {
    fail(`${file}: not valid JSON (${e.message})`);
    continue;
  }
  const keys = Object.keys(msgs).sort();
  for (const k of enKeys.filter((k) => !keys.includes(k))) fail(`${file}: missing ${k}`);
  for (const k of keys.filter((k) => !enKeys.includes(k))) fail(`${file}: unknown key ${k}`);
  for (const k of keys.filter((k) => enKeys.includes(k))) {
    const text = msgs[k].message || "";
    const source = en[k].message;
    if (!text.trim()) fail(`${file}: ${k} is empty`);
    if (placeholders(text) !== placeholders(source)) fail(`${file}: ${k} placeholders ${placeholders(text) || "none"} ≠ ${placeholders(source) || "none"}`);
    if (tags(text) !== tags(source)) fail(`${file}: ${k} HTML tags differ from English`);
    if (tokens(text) !== tokens(source)) fail(`${file}: ${k} {tokens} differ from English`);
    if (/<(?!\/?(code|strong)>)/i.test(text)) fail(`${file}: ${k} has HTML other than <code>/<strong>`);
    if (/\$(?![A-Z_]+\$)/i.test(text.replace(/\$[A-Z_]+\$/gi, ""))) fail(`${file}: ${k} has a stray "$" (write "$$" for a literal dollar)`);
  }
  if ((msgs.extName?.message || "").length > 75) fail(`${file}: extName is longer than 75 characters`);
  if ((msgs.extDescription?.message || "").length > 132) fail(`${file}: extDescription is longer than 132 characters (store limit)`);
}

// Every message the code uses exists, and every message is used somewhere.
// Quoted keys ("askSaving", "@detailGifFrames", data-i18n="optSaved") and manifest __MSG_key__ references.
const KEY = /(?:["'`]@?|__MSG_)((?:ext|menu|ask|opt|detail|copy|edit|review|find)[A-Z][A-Za-z0-9]*)(?=["'`]|__)/g;
const used = new Set();
for await (const path of walk(EXT)) {
  if (!/\.(js|html|json)$/.test(path) || path.includes("_locales")) continue;
  for (const [, k] of (await readFile(path, "utf8")).matchAll(KEY)) used.add(k);
}
for (const k of [...used].filter((k) => !en[k])) fail(`code uses message "${k}", which isn't in _locales/en/messages.json`);
for (const k of enKeys.filter((k) => !used.has(k))) fail(`_locales/en/messages.json: "${k}" is never used`);

if (problems.length) {
  console.error(`Static check failed:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log("Static check passed: 4 permissions (+ activeTab, scripting optional), no host access, network only in offscreen.js (your image) and lib/telemetry.js (one PostHog URL), no other outside URLs; one compiled part (AVIF encoder), pinned.");
