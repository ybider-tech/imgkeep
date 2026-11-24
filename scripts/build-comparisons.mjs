// The comparison pages, rendered from data/competitor-facts.json so one fact changes everywhere at once.
//
//   node scripts/build-comparisons.mjs           rewrite the generated blocks in both pages
//   node scripts/build-comparisons.mjs --check   exit 1 if a page doesn't match the facts file (used by the tests)
//
// Each page keeps its own hand-written copy; only the blocks between <!-- facts:NAME --> and <!-- /facts:NAME -->
// are generated: the "pick by what you need" cards, the tables, and one closed details section per extension
// in which every fact links to its public source. "not-stated" shows as a dash, which the legend and screen
// readers spell out as "Not stated": we never fill a gap with a guess. "soon" is only for Imgkeep's own plans.
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const FACTS_FILE = join(ROOT, "data", "competitor-facts.json");
export const PAGES = {
  best: "site/best-save-image-as-extensions/index.html",
  versus: "site/imgkeep-vs-save-webp-as-png-or-jpeg/index.html",
};
const RIVAL = "save-webp-as-png-or-jpeg";
const US = "imgkeep";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const day = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
const STORE = { chrome: "Chrome", edge: "Edge", firefox: "Firefox" };
const BROWSERS = ["chrome", "firefox", "edge"];
// Imgkeep first in the tables (it's our page; the details below say so), then the rest in the file's order.
const ordered = (data) => [data.extensions.find((e) => e.id === US), ...data.extensions.filter((e) => e.id !== US)];
// Store names can carry keyword tails ("Save Image As Type - WebP to JPG, PNG, PDF"); tables and cards use the plain name.
const plain = (e) => e.name.replace(/ - .*$/, "").replace(/ \(Converter\)$/, "").replace(/^Image Formatter: .*/, "Image Formatter");
const who = (e) => (e.id === US ? "Imgkeep" : `${e.publisher.replace(/ \(.*\)$/, "")}'s ${plain(e)}`);

const MARK = {
  yes: '<span class="m yes" aria-hidden="true">✓</span><span class="sr-only">Yes</span>',
  no: '<span class="m no" aria-hidden="true">✕</span><span class="sr-only">No</span>',
  "not-stated": '<span class="m ns" aria-hidden="true">–</span><span class="sr-only">Not stated</span>',
};

// The compact form, for the tables.
function mark(e, key) {
  if (key === "browsers") return e.stores.map((s) => STORE[s.store]).join(", ");
  if (key === "updated") return e.stores.map((s) => `${e.stores.length > 1 ? `${STORE[s.store]} ` : ""}${day(s.updated)}`).join("<br>");
  const f = e.facts[key];
  if (!f || f.value === "not-stated") return MARK["not-stated"];
  if (key === "formats" || key === "permissions") return `<span class="fmt">${esc(short(f))}</span>`;
  if (key === "siteAccess") return `<span class="acc${f.value === "asked" ? " ok" : ""}">${esc(f.text)}</span>`;
  if (f.value === "soon") return `<span class="soon">${esc(f.text)}</span>`;
  if (f.value === "partial") return `<span class="part">${esc(short(f))}</span>`;
  return MARK[f.value] || esc(f.text);
}
// "partial" facts need a few words in the table; the details give the full sentence.
const short = (f) => f.short || f.text;

// The full form, for the details: mark plus what the source says.
function full(e, key) {
  const f = e.facts[key];
  if (!f || f.value === "not-stated") return "Not stated";
  const word = { yes: "Yes", no: "No" }[f.value];
  const text = f.text ? esc(f.text) : "";
  if (!word) return text;
  if (!text || text === word) return word;
  return text.startsWith(word) ? text : `${word}: ${text}`;
}
const sourceLinks = (e, keys) => keys.map((k) => `<a href="${esc(e.sources[k].url)}" rel="nofollow">${esc(e.sources[k].label)}</a>`).join(", ");

function checkedLine(data) {
  return `<p class="checked">Last checked <time datetime="${data.checked}">${day(data.checked)}</time> from each extension's own listing, package or code. Something out of date? Email <a href="mailto:${data.contact}">${data.contact}</a>.</p>`;
}

const legend = () =>
  `<p class="legend"><span class="m yes" aria-hidden="true">✓</span> yes · <span class="m no" aria-hidden="true">✕</span> no · <span class="m ns" aria-hidden="true">–</span> not stated by the publisher · Site access: “All sites” can read every page you visit, “When asked” only a page you use it on.</p>`;

// "Pick by what you need": worked out from the facts, so a card never names an extension the facts don't support.
function needs(data) {
  const has = {
    pdf: (e) => /\bPDF\b/.test(e.facts.formats?.text || ""),
    siteAccess: (e) => e.facts.siteAccess?.value === "asked",
  };
  const cards = data.needs.map(([key, title]) => {
    const test = has[key] || ((e) => e.facts[key]?.value === "yes");
    const list = ordered(data).filter(test);
    const only = list.length === 1 ? " (the only one that says so)" : "";
    return `  <div class="need"><strong>${esc(title)}</strong><span>${list.map((e) => esc(who(e))).join(", ")}${only}</span></div>`;
  });
  return ['<div class="needs">', ...cards, "</div>"].join("\n      ");
}

// Extensions across, criteria down, one tab per browser. Plain radio buttons and CSS, no script: every column is in
// the page, the tab only hides the ones not on that store.
function table(data) {
  const exts = ordered(data);
  const cls = (e) => [...e.stores.map((s) => `in-${s.store}`), e.id === US ? "us" : ""].join(" ").trim();
  const count = (b) => exts.filter((e) => e.stores.some((s) => s.store === b)).length;
  const tabs = BROWSERS.map(
    (b, i) => `<input type="radio" name="browser" id="tab-${b}" class="tab-input"${i ? "" : " checked"}><label for="tab-${b}" class="tab">${STORE[b]} <small>${count(b)}</small></label>`,
  );
  const head = `<tr><th scope="col"><span class="sr-only">Criteria</span></th>${exts.map((e) => `<th scope="col" class="${cls(e)}">${esc(plain(e))}<span class="by">${esc(e.id === US ? "Ours" : e.publisher.replace(/ \(.*\)$/, ""))}</span></th>`).join("")}</tr>`;
  const rows = data.tableRows.map(([k, label]) => `<tr><th scope="row">${esc(label)}</th>${exts.map((e) => `<td class="${cls(e)}">${mark(e, k)}</td>`).join("")}</tr>`);
  return [
    legend(),
    `<div class="browser-tabs">`,
    ...tabs.map((t) => `  ${t}`),
    '  <div class="table-wrap compare-wrap">',
    '    <table class="compare">',
    `      <thead>${head}</thead>`,
    "      <tbody>",
    ...rows.map((r) => `        ${r}`),
    "      </tbody>",
    "    </table>",
    "  </div>",
    "</div>",
  ].join("\n      ");
}

// Two extensions side by side (Imgkeep first), every criterion.
function pair(data) {
  const a = data.extensions.find((e) => e.id === US);
  const b = data.extensions.find((e) => e.id === RIVAL);
  const rows = data.columns.map(([k, label]) => `<tr><th scope="row">${esc(label)}</th><td class="us">${mark(a, k)}</td><td>${mark(b, k)}</td></tr>`);
  return [
    legend(),
    '<div class="table-wrap">',
    '  <table class="compare pair">',
    `    <thead><tr><th scope="col"><span class="sr-only">Criteria</span></th><th scope="col" class="us">Imgkeep<span class="by">Ours</span></th><th scope="col">${esc(plain(b))}<span class="by">${esc(b.publisher)}</span></th></tr></thead>`,
    "    <tbody>",
    ...rows.map((r) => `      ${r}`),
    "    </tbody>",
    "  </table>",
    "</div>",
  ].join("\n      ");
}

// One closed section per extension: what it says it does, every fact with its source, when it was checked.
function entry(data, e) {
  const stores = e.stores.map((s) => STORE[s.store]).join(", ");
  const lines = [
    // Kept in English on translated pages: these lines quote English store listings, and stay in step with the facts.
    `<details class="entry" id="${e.id}" lang="en" data-keep-english>`,
    `  <summary><strong>${esc(e.name)}</strong> <span class="by">${esc(e.publisher)} · ${stores}</span></summary>`,
    `  <p>${esc(e.summary)}</p>`,
    '  <ul class="facts">',
  ];
  for (const [k, label] of data.columns) {
    if (k === "browsers" || k === "updated") continue;
    const f = e.facts[k];
    const src = f.sources.length ? ` <span class="src">(${sourceLinks(e, f.sources)})</span>` : f.note ? ` <span class="src">(${esc(f.note)})</span>` : "";
    lines.push(`    <li><strong>${esc(label)}:</strong> ${full(e, k)}${src}</li>`);
  }
  for (const a of e.alsoStated) lines.push(`    <li>${esc(a.text)} <span class="src">(${sourceLinks(e, a.sources)})</span></li>`);
  const listed = e.stores.map((s) => `<a href="${esc(e.sources[s.source].url)}" rel="nofollow">${STORE[s.store]}</a> ${esc(s.version)}, updated ${day(s.updated)}`);
  lines.push(`    <li><strong>Stores:</strong> ${listed.join("; ")}</li>`, "  </ul>");
  lines.push(`  <p class="checked">Checked ${day(e.facts.formats.checked)}.</p>`, "</details>");
  return lines.join("\n      ");
}
const entries = (data) => data.extensions.map((e) => entry(data, e)).join("\n      ");
const pairEntries = (data) => [US, RIVAL].map((id) => entry(data, data.extensions.find((e) => e.id === id))).join("\n      ");

const BLOCKS = {
  best: { checked: checkedLine, needs, table, entries },
  versus: { checked: checkedLine, pair, entries: pairEntries },
};

export async function render(page, html, data) {
  let out = html;
  for (const [name, fn] of Object.entries(BLOCKS[page])) {
    const re = new RegExp(`(<!-- facts:${name} -->)[\\s\\S]*?(<!-- /facts:${name} -->)`);
    if (!re.test(out)) throw new Error(`${PAGES[page]} has no <!-- facts:${name} --> block`);
    out = out.replace(re, (m, open, close) => `${open}\n      ${fn(data)}\n      ${close}`);
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const data = JSON.parse(await readFile(FACTS_FILE, "utf8"));
  const check = process.argv.includes("--check");
  let stale = 0;
  for (const [page, file] of Object.entries(PAGES)) {
    const path = join(ROOT, file);
    const html = await readFile(path, "utf8");
    const out = await render(page, html, data);
    if (out === html) continue;
    if (check) {
      console.log(`${file} doesn't match data/competitor-facts.json. Run node scripts/build-comparisons.mjs`);
      stale++;
    } else {
      await writeFile(path, out);
      console.log(`Updated ${file}`);
    }
  }
  if (stale) process.exit(1);
}
