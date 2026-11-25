// The converter's pair pages (/webp-to-jpg/, /heic-to-pdf/…) and their index (/convert/formats/), rendered from
// data/pairs.json (one entry per page) and data/formats.json (facts written once per format) with
// data/templates/pair.html.
//
//   node scripts/build-pair-pages.mjs               write the pages
//   node scripts/build-pair-pages.mjs --check       exit 1 if a page doesn't match the data (used by the tests)
//   node scripts/build-pair-pages.mjs --similarity  how much body text any two pages share (5-word shingles)
//
// Pages of wave 0 existed before the template and keep their addresses. The language menu and
// hreflang links are added by scripts/translate-site.mjs for translated pages, so they're kept from the current file.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { cssVersion } from "./version-css.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = join(ROOT, "site");
const ORIGIN = "https://imgkeep.app";
export const INDEX_FILE = "convert/formats/index.html";
// Pages may share boilerplate (the converter, its help, the extension box), but their own text must differ:
// no two pages may share more than this fraction of their body's 5-word shingles.
export const MAX_SHARED = 0.35;

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const human = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
const strip = (html) => html.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, "&");

// JSON exactly as the pages already have it: Python's json.dumps(…, ensure_ascii=False), ", " and ": ".
export function pyJson(v) {
  if (Array.isArray(v)) return `[${v.map(pyJson).join(", ")}]`;
  if (v && typeof v === "object") return `{${Object.entries(v).map(([k, x]) => `${JSON.stringify(k)}: ${pyJson(x)}`).join(", ")}}`;
  return JSON.stringify(v);
}

export async function load() {
  const [template, formats, data] = await Promise.all([
    readFile(join(ROOT, "data", "templates", "pair.html"), "utf8").then((t) => t.replace(/\r\n/g, "\n")), // LF even on a Windows checkout
    readFile(join(ROOT, "data", "formats.json"), "utf8").then(JSON.parse),
    readFile(join(ROOT, "data", "pairs.json"), "utf8").then(JSON.parse),
  ]);
  // The stylesheet link carries the current style.css version, as on every other page (scripts/version-css.mjs).
  return { template: template.replace("{{css}}", await cssVersion()), formats, data, bySlug: Object.fromEntries(data.pairs.map((p) => [p.slug, p])) };
}

function table(p, formats) {
  const a = formats.formats[p.from];
  const b = formats.formats[p.to];
  const rows = formats.rows.map(([k, label]) => `            <tr><th scope="row">${label}</th><td>${a[k]}</td><td>${b[k]}</td></tr>`);
  return [
    `      <h2>${a.label} and ${b.label} compared</h2>`,
    '      <div class="table-wrap">',
    '        <table class="fmt-table">',
    `          <thead><tr><th scope="col"><span class="sr-only">Format</span></th><th scope="col">${a.label}</th><th scope="col">${b.label}</th></tr></thead>`,
    "          <tbody>",
    ...rows,
    "          </tbody>",
    "        </table>",
    "      </div>",
  ].join("\n");
}

function body(p, formats) {
  const sections = p.sections.map((s) => (s.table ? table(p, formats) : `      <h2>${s.h2}</h2>\n      ${s.html}`));
  const faq = p.faq.map((f) => `      <h3>${f.q}</h3>\n      <p>${f.a}</p>`).join("\n");
  return `\n${sections.map((s) => `${s}\n\n`).join("")}\n      <h2>Questions</h2>\n${faq}`;
}

export function renderPair(p, site, current = "") {
  const { template, formats, bySlug } = site;
  const url = `${ORIGIN}/${p.slug}/`;
  const app = {
    "@context": "https://schema.org", "@type": "WebApplication", "@id": `${url}#app`, name: p.app.name, url,
    description: p.app.description, applicationCategory: "MultimediaApplication", operatingSystem: "Any (runs in a web browser)",
    isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, featureList: p.app.featureList,
    isPartOf: { "@id": `${ORIGIN}/#site` }, publisher: { "@id": `${ORIGIN}/#org` },
  };
  const crumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Imgkeep", item: `${ORIGIN}/` },
    { "@type": "ListItem", position: 2, name: "Free Image Converter", item: `${ORIGIN}/convert/` },
    { "@type": "ListItem", position: 3, name: p.crumb, item: url },
  ] };
  // The visible questions, then "How do I convert X to Y?" answered with the short answer (structured data only).
  const questions = [...p.faq.map((f) => [f.q, f.a]), [`How do I convert ${p.crumb}?`, p.answer]];
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: questions.map(([q, a], i) => (
    { "@type": "Question", name: strip(q), acceptedAnswer: { "@type": "Answer", text: p.faq_ld?.[i] ?? strip(a) } })) };
  const guides = p.related.map((s) => {
    const r = bySlug[s];
    return `          <article class="cv-guide">\n            <h3><a href="../${s}/">${r.crumb}</a></h3>\n            <p>${r.card}</p>\n            <a class="cv-guide-link" href="../${s}/">Read the ${r.crumb} guide <span aria-hidden="true">→</span></a>\n          </article>`;
  }).join("\n");
  const keep = (re) => current.match(re)?.[0] ?? "";
  const slots = {
    hreflang: keep(/  <!-- hreflang -->[\s\S]*?<!-- \/hreflang -->\n/), langmenu: keep(/      <!-- lang-menu -->[\s\S]*?<!-- \/lang-menu -->\n/),
    title: p.title, description: p.description, slug: p.slug, ld_app: pyJson(app), ld_crumbs: pyJson(crumbs), ld_faq: pyJson(faqLd),
    crumb: p.crumb, h1: p.h1, lead: p.lead, to: p.to, accept: p.accept, offline: p.offline, guides,
    more: p.more.map((s) => ` · <a href="../${s}/">${bySlug[s].crumb}</a>`).join(""),
    answer: p.answer, updated: p.updated, updated_human: human(p.updated), body: body(p, formats),
  };
  return template.replace(/\{\{(\w+)\}\}/g, (m, k) => {
    if (!(k in slots)) throw new Error(`template slot {{${k}}} has no value`);
    return slots[k];
  });
}

// The index: every page, grouped by the format you start from.
export function renderIndex(site, current = "") {
  const { formats, data } = site;
  const groups = {};
  for (const p of data.pairs) (groups[p.from] ||= []).push(p);
  const order = ["heic", "webp", "avif", "jfif", "png", "jpg", "svg", "gif", "bmp", "ico"].filter((f) => groups[f]);
  const lists = order.map((f) => [
    `      <h2>From ${formats.formats[f].label}</h2>`,
    '      <ul class="fmt-index">',
    ...groups[f].map((p) => `        <li><a href="../../${p.slug}/">${p.crumb}</a>: ${p.lead}</li>`),
    "      </ul>",
  ].join("\n")).join("\n\n");
  const tpl = site.template;
  const head = tpl.slice(0, tpl.indexOf("<script type=\"application/ld+json\">"));
  const url = `${ORIGIN}/${INDEX_FILE.replace(/index\.html$/, "")}`;
  const title = "Image Converter Formats: Every Conversion";
  const description = "Every image conversion the free converter does in your browser, with no uploads: HEIC, WebP, AVIF, JFIF, PNG, JPG and SVG to JPG, PNG, PDF, GIF, ICO and more.";
  const crumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Imgkeep", item: `${ORIGIN}/` },
    { "@type": "ListItem", position: 2, name: "Free Image Converter", item: `${ORIGIN}/convert/` },
    { "@type": "ListItem", position: 3, name: "All conversions", item: url },
  ] };
  const keep = (re) => current.match(re)?.[0] ?? "";
  const top = head
    .replace("{{hreflang}}", keep(/  <!-- hreflang -->[\s\S]*?<!-- \/hreflang -->\n/))
    .replace(/\{\{title\}\}/g, title).replace(/\{\{description\}\}/g, description).replace(/\{\{slug\}\}/g, "convert/formats")
    .replace('<meta property="og:type" content="website">', '<meta property="og:type" content="website">');
  const footer = tpl.slice(tpl.indexOf("    <footer>"));
  return `${top}<script type="application/ld+json">
  ${pyJson(crumbs)}
  </script>
  <link rel="preload" href="../../fonts/source-sans-3-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="../../fonts/schibsted-grotesk-700-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${tpl.match(/href="\.\.\/(style\.css\?v=[0-9a-f]+)"/)[1].replace(/^/, "../../")}">
  <link rel="icon" href="../../favicon.png?v=brand20261110" type="image/png">
  <script src="/stores.js" defer></script>
  <script src="/count.js" defer></script>
</head>
<body>
  <div class="page">
    <header>
      <a class="brand" href="../../"><img src="../../icon80.webp?v=brand20261110" alt="" width="36" height="36">Imgkeep</a>
      <nav class="cv-nav" aria-label="Main"><a href="../" aria-current="page">Converter</a><a href="../../color-palette-from-image/">Color palette</a><a href="../../privacy.html">Privacy</a></nav>
${keep(/      <!-- lang-menu -->[\s\S]*?<!-- \/lang-menu -->\n/)}    </header>
    <main class="doc">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="../">← Converter</a> › All conversions</nav>
      <h1>Every conversion, one page each</h1>
      <p class="lead">The <a href="../">Free Image Converter</a> works in your browser: your images are never uploaded. Each page below opens it set to one conversion, with what that conversion keeps and loses.</p>

${lists}
    </main>
${footer.replace(/href="\.\.\//g, 'href="../../')}`;
}

// 5-word shingles of a page's own text (main content, minus the shared converter block and extension box).
export function shingles(html) {
  const main = html.slice(html.indexOf('<p class="label">Short answer</p>'), html.indexOf('<section class="cv-ext"'));
  const words = strip(main).toLowerCase().match(/[\p{L}\p{N}']+/gu) || [];
  const set = new Set();
  for (let i = 0; i + 5 <= words.length; i++) set.add(words.slice(i, i + 5).join(" "));
  return set;
}
export function similarity(pages) {
  const sets = Object.fromEntries(Object.entries(pages).map(([k, h]) => [k, shingles(h)]));
  const keys = Object.keys(sets);
  const pairs = [];
  for (let i = 0; i < keys.length; i++)
    for (let j = i + 1; j < keys.length; j++) {
      const a = sets[keys[i]], b = sets[keys[j]];
      let shared = 0;
      for (const s of a) if (b.has(s)) shared++;
      pairs.push({ a: keys[i], b: keys[j], shared: shared / Math.min(a.size, b.size) });
    }
  return pairs.sort((x, y) => y.shared - x.shared);
}

export async function renderAll() {
  const site = await load();
  const out = {};
  for (const p of site.data.pairs) {
    const file = `${p.slug}/index.html`;
    const current = existsSync(join(SITE, file)) ? (await readFile(join(SITE, file), "utf8")).replace(/\r\n/g, "\n") : "";
    out[file] = renderPair(p, site, current);
  }
  const current = existsSync(join(SITE, INDEX_FILE)) ? (await readFile(join(SITE, INDEX_FILE), "utf8")).replace(/\r\n/g, "\n") : "";
  out[INDEX_FILE] = renderIndex(site, current);
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = await renderAll();
  if (process.argv.includes("--similarity")) {
    const pages = Object.fromEntries(Object.entries(out).filter(([f]) => f !== INDEX_FILE));
    const sims = similarity(pages);
    const avg = sims.reduce((t, s) => t + s.shared, 0) / sims.length;
    console.log(`${Object.keys(pages).length} pages, ${sims.length} pairs of pages. Shared 5-word shingles: highest ${(sims[0].shared * 100).toFixed(1)}%, average ${(avg * 100).toFixed(1)}%, limit ${MAX_SHARED * 100}%.`);
    for (const s of sims.slice(0, 10)) console.log(`  ${(s.shared * 100).toFixed(1).padStart(5)}%  ${s.a.replace("/index.html", "")} · ${s.b.replace("/index.html", "")}`);
    process.exit(sims.some((s) => s.shared > MAX_SHARED) ? 1 : 0);
  }
  let stale = 0;
  for (const [file, html] of Object.entries(out)) {
    const path = join(SITE, file);
    const now = existsSync(path) ? (await readFile(path, "utf8")).replace(/\r\n/g, "\n") : null;
    if (now === html) continue;
    if (process.argv.includes("--check")) {
      console.log(`${file} doesn't match data/pairs.json. Run node scripts/build-pair-pages.mjs`);
      stale++;
    } else {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, html);
      console.log(`${now === null ? "Created" : "Updated"} site/${file}`);
    }
  }
  if (stale) process.exit(1);
}
