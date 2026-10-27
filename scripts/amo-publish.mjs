// Submits the Firefox build to addons.mozilla.org (AMO) with its listing, through Mozilla's own tool
// (web-ext sign, AMO API v5). Credentials: ~/.config/imgkeep/amo.env with
//   AMO_JWT_ISSUER=user:12345:678
//   AMO_JWT_SECRET=…
// (addons.mozilla.org → Developer Hub → Manage API keys). Never printed.
//
//   node scripts/amo-publish.mjs            show what would be sent (nothing is uploaded)
//   node scripts/amo-publish.mjs --submit   build dist/firefox and submit it, listed, for review
//
// The summary, description and reviewer notes come from store/amo-listing.md (English) and, when present,
// store/amo-translations/<amo-locale>.md, written by the translation pipeline.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, readdir, writeFile, mkdtemp } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const submit = process.argv.includes("--submit");

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
  const dir = join(ROOT, "store", "amo-translations");
  if (existsSync(dir)) {
    for (const file of (await readdir(dir)).filter((f) => f.endsWith(".md"))) {
      const text = await readFile(join(dir, file), "utf8");
      const locale = file.replace(/\.md$/, "");
      summary[locale] = block(text, "Summary");
      description[locale] = block(text, "Description");
    }
  }
  for (const [locale, s] of Object.entries(summary)) if (s.length > 250) throw new Error(`AMO summary ${locale} is ${s.length} characters (max 250)`);
  return {
    categories: { firefox: ["photos-music-videos", "other"] },
    summary,
    description,
    homepage: { "en-US": "https://imgkeep.app" },
    support_url: { "en-US": "https://imgkeep.app/support.html" },
    support_email: { "en-US": "helloimgkeep@gmail.com" },
    slug: "imgkeep",
    version: { license: "MIT", approval_notes: block(en, "Notes for reviewers"), compatibility: ["firefox"] },
  };
}

const metadata = await amoMetadata();
if (!submit) {
  console.log(`Would submit dist/firefox as a listed add-on, with ${Object.keys(metadata.summary).length} languages: ${Object.keys(metadata.summary).join(", ")}`);
  console.log(`Summary (en-US, ${metadata.summary["en-US"].length} chars): ${metadata.summary["en-US"]}`);
  console.log("Nothing uploaded. Run with --submit to send it for review.");
  process.exit(0);
}

const envFile = join(homedir(), ".config", "imgkeep", "amo.env");
if (!existsSync(envFile)) throw new Error(`Missing ${envFile} (AMO_JWT_ISSUER and AMO_JWT_SECRET)`);
const env = Object.fromEntries(
  (await readFile(envFile, "utf8")).split("\n").filter((l) => /^\w+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
if (!env.AMO_JWT_ISSUER || !env.AMO_JWT_SECRET) throw new Error("amo.env needs AMO_JWT_ISSUER and AMO_JWT_SECRET");

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
