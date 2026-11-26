// Builds the Edge package from the Chrome one: the same files, only the name differs.
//   dist/imgkeep-edge-<version>.zip   for Edge Add-ons (scripts/edge-publish.sh)
// Edge rejected 0.11.0 (review of 2026-11-03, policy 1.1.2: "The title contains excessive search terms"), so
// on Edge the name lists three formats, in every language, with a hyphen before the brand:
//   "Save image as PNG, JPG or WebP - Imgkeep"
// Until 0.15.1 it was worked out from Chrome's name. Since 0.15.2 Chrome's name says "convert WebP to JPG"
// (store/listing-keywords-report.md), so Edge keeps its approved names, one per language, in store/edge-names.json.
// Edge's own search terms (Partner Center) carry GIF, PDF, AVIF and the rest.
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export const EDGE_NAMES = JSON.parse(readFileSync(join(ROOT, "store", "edge-names.json"), "utf8"));
export function edgeName(lang) {
  const name = EDGE_NAMES[lang];
  if (!name) throw new Error(`No Edge name for "${lang}" in store/edge-names.json`);
  return name;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { version } = JSON.parse(await readFile(join(ROOT, "extension", "manifest.json"), "utf8"));
  const from = join(ROOT, "dist", `imgkeep-${version}.zip`);
  const out = join(ROOT, "dist", `imgkeep-edge-${version}.zip`);
  if (!existsSync(from)) throw new Error(`No ${from}. Run: sh scripts/package.sh`);
  const dir = await mkdtemp(join(tmpdir(), "imgkeep-edge-"));
  try {
    execFileSync("unzip", ["-q", from, "-d", dir]);
    for (const lang of await readdir(join(dir, "_locales"))) {
      const file = join(dir, "_locales", lang, "messages.json");
      const raw = await readFile(file, "utf8");
      const messages = JSON.parse(raw);
      messages.extName.message = edgeName(lang);
      const indent = raw.match(/\n(\s+)"/)?.[1].length ?? 2;
      await writeFile(file, JSON.stringify(messages, null, indent) + (raw.endsWith("\n") ? "\n" : ""));
    }
    await rm(out, { force: true });
    execFileSync("zip", ["-r", "-X", "-q", out, "."], { cwd: dir });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
  console.log(`Built ${out}`);
}
