// Static trust check. Fails if the extension asks for more than it should,
// makes network calls outside offscreen.js, or references outside URLs.
import { readFile, readdir } from "node:fs/promises";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const EXT = join(dirname(fileURLToPath(import.meta.url)), "..", "extension");
const ALLOWED_PERMISSIONS = ["contextMenus", "downloads", "offscreen", "storage"];
const ALLOWED_OPTIONAL_HOSTS = ["http://*/*", "https://*/*"];
const ALLOWED_URL = /^https?:\/\/((www\.)?imgkeep\.app|chromewebstore\.google\.com|chrome\.google\.com\/webstore)(\/|$)/;
const TEXT_FILES = /\.(js|mjs|html|css|json|md|txt)$/;

const problems = [];
const fail = (msg) => problems.push(msg);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

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
if ((manifest.optional_permissions || []).length) fail("manifest must not declare optional_permissions");
if (manifest.manifest_version !== 3) fail("manifest_version must be 3");
if (JSON.stringify(manifest).includes("<all_urls>")) fail("manifest must not mention <all_urls>");
if (manifest.description.length > 132) fail("description is longer than 132 characters");

// Files
for await (const path of walk(EXT)) {
  if (!TEXT_FILES.test(path)) continue;
  const rel = relative(EXT, path);
  let text = await readFile(path, "utf8");
  if (rel === "manifest.json") {
    for (const p of ALLOWED_OPTIONAL_HOSTS) text = text.replaceAll(`"${p}"`, '""');
  }
  if (/\bfetch\s*\(/.test(text) && rel !== "offscreen.js") fail(`${rel}: fetch( is only allowed in offscreen.js`);
  for (const [url] of text.matchAll(/https?:\/\/[^\s"'`<>)\]]*/g)) {
    if (!ALLOWED_URL.test(url)) fail(`${rel}: outside URL ${url}`);
  }
  if (/\b(eval|new Function)\s*\(/.test(text)) fail(`${rel}: eval/new Function is not allowed`);
  if (/\bimportScripts\s*\(|\bimport\s*\(\s*["'`]https?:/.test(text)) fail(`${rel}: remote code is not allowed`);
}

if (problems.length) {
  console.error(`Static check failed:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log("Static check passed: 4 permissions, no host access, fetch only in offscreen.js, no outside URLs.");
