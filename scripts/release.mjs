// One release, start to finish, in order. Each step is a script that also works on its own.
//
//   node scripts/release.mjs                 the plan for the version in extension/manifest.json (nothing runs)
//   node scripts/release.mjs --go            run every step below that isn't done yet
//   node scripts/release.mjs --go --only=translate,test   just those steps
//
// Steps (stops at the first failure):
//   translate  new and changed strings into every language (scripts/translate.mjs --run --batch)
//   test       the static check and every test, Chrome and Firefox (npm test)
//   package    dist/imgkeep-<v>.zip and dist/imgkeep-firefox-<v>.zip (scripts/package.sh)
//   tag        dates the CHANGELOG entry, commits, tags v<version>
//   push       pushes the branch and tag, then waits for CI to pass (gh)
//   chrome     uploads and submits to the Chrome Web Store (scripts/cws-publish.mjs --submit)
//   edge       uploads and submits to Edge Add-ons (scripts/edge-publish.sh --submit)
//   firefox    submits to addons.mozilla.org with its listing in every language (scripts/amo-publish.mjs --submit)
//
// Not here: the Chrome and Edge store descriptions and screenshots. Neither store's API can change them, so
// they're filled in their dashboards, from store/i18n/<lang>.json, by browser automation (Claude in Chrome).
// Submitting needs Yaron's OK for each release, and never while the previous version is still in review.
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STEPS = ["translate", "test", "package", "tag", "push", "chrome", "edge", "firefox"];
const args = process.argv.slice(2);
const go = args.includes("--go");
const only = args.find((a) => a.startsWith("--only="))?.slice(7).split(",");
const steps = only ? STEPS.filter((s) => only.includes(s)) : STEPS;
for (const s of only || []) if (!STEPS.includes(s)) throw new Error(`Unknown step ${s}. Steps: ${STEPS.join(", ")}`);

const { version } = JSON.parse(await readFile(join(ROOT, "extension", "manifest.json"), "utf8"));
const tag = `v${version}`;
const sh = (cmd, cmdArgs, opts = {}) => execFileSync(cmd, cmdArgs, { cwd: ROOT, stdio: "inherit", ...opts });
const out = (cmd, cmdArgs) => execFileSync(cmd, cmdArgs, { cwd: ROOT, encoding: "utf8" }).trim();
const today = new Date().toISOString().slice(0, 10);

const RUN = {
  translate: () => sh(process.execPath, ["scripts/translate.mjs", "--run", "--batch"]),
  test: () => sh("npm", ["test"]),
  package: () => sh("sh", ["scripts/package.sh"]),
  async tag() {
    if (out("git", ["tag", "-l", tag])) return console.log(`${tag} already exists.`);
    const file = join(ROOT, "CHANGELOG.md");
    const log = await readFile(file, "utf8");
    if (!log.includes(`## ${version} — `)) throw new Error(`CHANGELOG.md has no "## ${version} — …" entry`);
    await writeFile(file, log.replace(`## ${version} — unreleased`, `## ${version} — ${today}`));
    sh("git", ["add", "-A", "CHANGELOG.md", "extension/_locales", "store/i18n", "i18n"]);
    if (out("git", ["diff", "--cached", "--name-only"])) sh("git", ["commit", "-q", "-m", `${version}: dated ${today}, translations\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`]);
    sh("git", ["tag", tag]);
  },
  push() {
    sh("git", ["push", "-q", "origin", "HEAD", tag]);
    const sha = out("git", ["rev-parse", "HEAD"]);
    // Wait for the Tests workflow on this commit (Windows CI once caught what macOS didn't).
    for (let i = 0; i < 60; i++) {
      const runs = JSON.parse(out("gh", ["run", "list", "--commit", sha, "--json", "databaseId,workflowName,status"]));
      const tests = runs.find((r) => r.workflowName === "Tests");
      if (tests) return sh("gh", ["run", "watch", String(tests.databaseId), "--exit-status"]);
      execFileSync("sleep", ["5"]);
    }
    throw new Error("No Tests run appeared for this commit");
  },
  chrome: () => sh(process.execPath, ["scripts/cws-publish.mjs", "--submit"]),
  edge: () => sh("sh", ["scripts/edge-publish.sh", "--submit"]),
  firefox: () => sh(process.execPath, ["scripts/amo-publish.mjs", "--submit"]),
};

console.log(`Imgkeep ${version} (${tag}): ${steps.join(" → ")}`);
if (!go) {
  sh(process.execPath, ["scripts/translate.mjs"]);
  console.log("\nNothing ran. Add --go to run these steps.");
  process.exit(0);
}
for (const step of steps) {
  console.log(`\n== ${step} ==`);
  await RUN[step]();
}
console.log(`\n${tag} released: ${steps.join(", ")}. Store descriptions and screenshots: fill in from store/i18n/ if they changed.`);
