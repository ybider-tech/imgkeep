// Submits the Firefox build to addons.mozilla.org (AMO) with its listing, through Mozilla's own tool
// (web-ext sign, AMO API v5). Credentials: ~/.config/imgkeep/amo.env with
//   AMO_JWT_ISSUER=user:12345:678
//   AMO_JWT_SECRET=…
// (addons.mozilla.org → Developer Hub → Manage API keys). Never printed.
//
//   node scripts/amo-publish.mjs            show what would be sent, language by language (nothing is uploaded)
//   node scripts/amo-publish.mjs --submit   build dist/firefox and submit it, listed, for review
//   node scripts/amo-publish.mjs --listing  update only the listing's summary and description (no new version)
//
// English (summary, description, reviewer notes) comes from store/amo-listing.md; the other languages from
// store/i18n/<lang>.json (amoSummary, amoDescription), written by scripts/translate.mjs. Until 2026-11-22 this
// read a folder that never existed (store/amo-translations), so the listing was English only.
import { execFileSync } from "node:child_process";
import { createHmac, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, readdir, writeFile, mkdtemp } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const submit = process.argv.includes("--submit");
const listingOnly = process.argv.includes("--listing");

// Our language codes (Chrome's) → addons.mozilla.org's. AMO uses region codes where Firefox does (es-ES…),
// Bokmål (nb-NO) for Norwegian. Spanish also fills AMO's Latin American Spanish.
export const AMO_LOCALE = {
  es: ["es-ES", "es-MX", "es-AR", "es-CL"], no: ["nb-NO"], pt_BR: ["pt-BR"], pt_PT: ["pt-PT"], sv: ["sv-SE"],
  zh_CN: ["zh-CN"], zh_TW: ["zh-TW"],
};
// The languages AMO accepts in production (addons-server src/olympia/core/languages.py PROD_LANGUAGES, checked
// 2026-11-22; its wider ALL_LANGUAGES list is refused). Ours that aren't here (am ar bg bn ca da et fil gu hi id
// kn lt lv ml mr ms sw ta te th) show the English listing.
const AMO_SUPPORTED = new Set(("cs de dsb el en-CA en-GB en-US es-AR es-CL es-ES es-MX fa fi fr fur fy-NL he hr hsb hu " +
  "ia it ja ka kab ko nb-NO nl nn-NO pl pt-BR pt-PT ro ru sk sl sq sr sv-SE tr uk vi zh-CN zh-TW").split(" "));

const block = (text, heading) => {
  const at = text.indexOf(`## ${heading}`);
  if (at < 0) return "";
  const start = text.indexOf("```text\n", at) + 8;
  return text.slice(start, text.indexOf("\n```", start)).trim();
};

export async function amoMetadata() {
  const en = await readFile(join(ROOT, "store", "amo-listing.md"), "utf8");
  const summary = { "en-US": block(en, "Summary") };
  const description = { "en-US": block(en, "Description") };
  const skipped = [];
  const dir = join(ROOT, "store", "i18n");
  for (const file of (await readdir(dir)).filter((f) => f.endsWith(".json") && f !== "en.json").sort()) {
    const lang = file.replace(/\.json$/, "");
    const locales = (AMO_LOCALE[lang] || [lang]).filter((l) => AMO_SUPPORTED.has(l));
    const t = JSON.parse(await readFile(join(dir, file), "utf8"));
    if (!locales.length || !t.amoSummary?.trim() || !t.amoDescription?.trim()) {
      skipped.push(lang);
      continue;
    }
    for (const locale of locales) {
      summary[locale] = t.amoSummary.trim();
      description[locale] = t.amoDescription.trim();
    }
  }
  for (const [locale, s] of Object.entries(summary)) if (s.length > 250) throw new Error(`AMO summary ${locale} is ${s.length} characters (max 250)`);
  return {
    skipped,
    categories: { firefox: ["photos-music-videos"] },
    summary,
    description,
    homepage: { "en-US": "https://imgkeep.app" },
    support_url: { "en-US": "https://imgkeep.app/support.html" },
    support_email: { "en-US": "helloimgkeep@gmail.com" },
    slug: "imgkeep",
    version: { license: "MIT", approval_notes: block(en, "Notes for reviewers"), compatibility: ["firefox"] },
  };
}

// Only when run as a script (a test may import AMO_LOCALE and amoMetadata).
if (!process.argv[1] || fileURLToPath(import.meta.url) !== process.argv[1]) {
  // imported
} else {
const { skipped, ...metadata } = await amoMetadata();
if (!submit && !listingOnly) {
  const locales = Object.keys(metadata.summary);
  console.log(`The listing in ${locales.length} languages (summary characters, start of the summary):`);
  for (const l of locales) console.log(`  ${l.padEnd(6)} ${String(metadata.summary[l].length).padStart(3)}  ${metadata.summary[l].slice(0, 70)}…`);
  if (skipped.length) console.log(`Not on AMO (these show the English listing): ${skipped.join(", ")}`);
  console.log("Nothing uploaded. --listing updates the live listing's texts; --submit sends a new version with them.");
  process.exit(0);
}

const envFile = join(homedir(), ".config", "imgkeep", "amo.env");
if (!existsSync(envFile)) throw new Error(`Missing ${envFile} (AMO_JWT_ISSUER and AMO_JWT_SECRET)`);
const env = Object.fromEntries(
  (await readFile(envFile, "utf8")).split("\n").filter((l) => /^\w+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
if (!env.AMO_JWT_ISSUER || !env.AMO_JWT_SECRET) throw new Error("amo.env needs AMO_JWT_ISSUER and AMO_JWT_SECRET");

if (listingOnly) {
  // One write: AMO throttles listing edits per minute and per day.
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const iat = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ iss: env.AMO_JWT_ISSUER, jti: randomUUID(), iat, exp: iat + 60 })}`;
  const token = `${unsigned}.${createHmac("sha256", env.AMO_JWT_SECRET).update(unsigned).digest("base64url")}`;
  const res = await fetch(`https://addons.mozilla.org/api/v5/addons/addon/${metadata.slug}/`, {
    method: "PATCH",
    headers: { Authorization: `JWT ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ summary: metadata.summary, description: metadata.description }),
  });
  if (!res.ok) throw new Error(`AMO answered ${res.status}: ${(await res.text()).slice(0, 500)}`);
  console.log(`Listing updated: summary and description in ${Object.keys(metadata.summary).length} languages.`);
  process.exit(0);
}

execFileSync(process.execPath, [join(ROOT, "scripts", "build-firefox.mjs")], { stdio: "inherit" });
const metaFile = join(await mkdtemp(join(tmpdir(), "imgkeep-amo-")), "metadata.json");
await writeFile(metaFile, JSON.stringify(metadata, null, 2));
// Credentials go to web-ext through its environment, never on the command line.
execFileSync(
  "npx",
  ["-y", "web-ext@8", "sign", "--source-dir", join(ROOT, "dist", "firefox"), "--artifacts-dir", join(ROOT, "dist", "amo"), "--channel", "listed", "--amo-metadata", metaFile, "--approval-timeout", "0"],
  { stdio: "inherit", env: { ...process.env, WEB_EXT_API_KEY: env.AMO_JWT_ISSUER, WEB_EXT_API_SECRET: env.AMO_JWT_SECRET } },
);
console.log("Submitted to addons.mozilla.org for review.");
}
