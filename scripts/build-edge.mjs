// Builds the Edge package from the Chrome one: the same files, only the name differs.
//   dist/imgkeep-edge-<version>.zip   for Edge Add-ons (scripts/edge-publish.sh)
// Edge rejected 0.11.0 (review of 2026-11-03, policy 1.1.2: "The title contains excessive search terms"), so
// on Edge the name lists three formats instead of five, in every language, with a hyphen before the brand:
//   "Save image as PNG, JPG, WebP, GIF or PDF — Imgkeep"  →  "Save image as PNG, JPG or WebP - Imgkeep"
// Edge's own search terms (Partner Center) still carry GIF, PDF and the rest.
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Every language writes the list as PNG <sep> JPG <sep> WebP <sep> GIF <or> PDF: keep the first three,
// with that language's "or" before WebP, and keep whatever follows PDF ("-vormingus", "గా", "로"…).
export function edgeName(name) {
  const short = name.replace(/JPG(.{1,8}?)WebP(.{1,8}?)GIF(.{1,12}?)PDF/u, "JPG$3WebP").replace(/\s*—\s*Imgkeep$/u, " - Imgkeep");
  if (short === name || /GIF|PDF|—/.test(short) || !short.endsWith(" - Imgkeep")) throw new Error(`Can't shorten the name "${name}"`);
  return short;
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
      messages.extName.message = edgeName(messages.extName.message);
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
