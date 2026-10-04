// Stamps every page's stylesheet link with a hash of style.css (style.css?v=<hash>),
// so browsers fetch new styles as soon as they change instead of using a cached copy.
// Run after editing site/style.css: npm run version-css (a test fails if you forget).
import { readFile, writeFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = join(dirname(fileURLToPath(import.meta.url)), "..", "site");

export async function cssVersion() {
  // Line endings don't count, so a Windows checkout (CRLF) gets the same version as everyone else.
  const css = (await readFile(join(SITE, "style.css"), "utf8")).replace(/\r\n/g, "\n");
  return createHash("sha256").update(css).digest("hex").slice(0, 10);
}

export async function htmlFiles(dir = SITE) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory() && e.name !== "fonts") out.push(...(await htmlFiles(p)));
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const v = await cssVersion();
  for (const file of await htmlFiles()) {
    const html = await readFile(file, "utf8");
    const next = html.replace(/href="(\/|(?:\.\.\/)*)style\.css(?:\?v=[0-9a-f]+)?"/g, `href="$1style.css?v=${v}"`);
    if (next !== html) await writeFile(file, next);
  }
  console.log(`style.css?v=${v}`);
}
