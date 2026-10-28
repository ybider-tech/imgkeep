// Builds the translated website: imgkeep.app/<lang>/<page> for the key pages, from the English pages in site/.
// English stays the source; translated pages are generated (never edit them by hand) and committed.
//
//   node scripts/translate-site.mjs            what would be translated and roughly what it costs (no API call)
//   node scripts/translate-site.mjs --run      translate what's new or changed, then build every page
//   node scripts/translate-site.mjs --run --batch   the same through the Message Batches API (half price)
//   node scripts/translate-site.mjs --build    rebuild the pages from the saved translations only (no API)
//
// How a page is translated: the text of each block (a paragraph, a heading, a list item, a button…) is sent as
// one segment with its inline HTML, so sentences stay whole; attributes people read (alt, title, aria-label,
// descriptions) and JSON-LD texts go the same way. Each segment's translation is saved by the hash of its
// English (i18n/site/<lang>.json), so the footer, shared on every page, is translated once, and only new or
// changed English goes to Claude. Every result is checked: the same inline tags and links, the same {name}
// placeholders, and the title and description within their search-result lengths.
// Then, without Claude: links point to the translated page when there is one (otherwise to the English page),
// every version lists the others (hreflang), a language menu goes in the header, and lang.js offers the
// visitor's own language when the page has it. The converter's and palette tool's messages (t("…") in their
// app.js) get a strings block in the translated page.
import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "parse5";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = join(ROOT, "site");
const CACHE = join(ROOT, "i18n", "site");
const MODEL = "claude-opus-5";
const ORIGIN = "https://imgkeep.app";
const CHUNK = 60;

// Languages: where most users are (PostHog, October 2026). `ext` is the extension's locale, for its menu names.
export const SITE_LANGS = {
  es: { hreflang: "es", name: "Español", english: "Spanish", ext: "es" },
  zh: { hreflang: "zh-Hans", name: "简体中文", english: "Chinese (Simplified)", ext: "zh_CN" },
  "pt-br": { hreflang: "pt-BR", name: "Português (Brasil)", english: "Portuguese (Brazil)", ext: "pt_BR" },
  ja: { hreflang: "ja", name: "日本語", english: "Japanese", ext: "ja" },
  ar: { hreflang: "ar", name: "العربية", english: "Arabic", ext: "ar", rtl: true },
  fr: { hreflang: "fr", name: "Français", english: "French", ext: "fr" },
  de: { hreflang: "de", name: "Deutsch", english: "German", ext: "de" },
  ru: { hreflang: "ru", name: "Русский", english: "Russian", ext: "ru" },
  uk: { hreflang: "uk", name: "Українська", english: "Ukrainian", ext: "uk" },
  ko: { hreflang: "ko", name: "한국어", english: "Korean", ext: "ko" },
  it: { hreflang: "it", name: "Italiano", english: "Italian", ext: "it" },
  he: { hreflang: "he", name: "עברית", english: "Hebrew", ext: "he", rtl: true },
};

// The pages people arrive on: home, the converters, the palette tool, download and the top guides.
export const SITE_PAGES = [
  "index.html",
  "convert/index.html",
  "webp-to-jpg/index.html",
  "webp-to-png/index.html",
  "avif-to-jpg/index.html",
  "png-to-jpg/index.html",
  "png-to-ico/index.html",
  "color-palette-from-image/index.html",
  "download/index.html",
  "save-webp-as-jpg-png/index.html",
  "chrome-saves-images-as-webp/index.html",
  "save-avif-as-jpg-png/index.html",
  "save-image-right-click-not-working/index.html",
];
const APP_SCRIPTS = { "convert/": "convert/app.js", "color-palette-from-image/": "color-palette-from-image/app.js" };
const appFor = (urlPath) => appForFile(urlPath.replace(/^\//, ""));
const appForFile = (path) => APP_SCRIPTS[path] || (["webp-to-jpg/", "webp-to-png/", "avif-to-jpg/", "png-to-jpg/", "png-to-ico/"].includes(path) ? "convert/app.js" : null);

export const urlPath = (file) => "/" + file.replace(/index\.html$/, "");
const hash = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);

// ---- Finding what to translate in a page ----

const BLOCK = new Set(["p", "li", "h1", "h2", "h3", "h4", "h5", "h6", "dt", "dd", "td", "th", "figcaption", "summary", "label", "button", "legend", "caption", "blockquote", "title", "option"]);
const SKIP = new Set(["script", "style", "svg", "code", "pre", "kbd", "noscript"]);
const ATTRS = ["alt", "title", "aria-label", "placeholder"];
const META = new Set(["description", "og:title", "og:description", "og:image:alt", "twitter:title", "twitter:description"]);
const LD_KEYS = new Set(["name", "text", "description", "headline", "alternateName", "browserRequirements", "featureList", "applicationSubCategory"]);
// Text that stays as it is in every language.
const KEEP = /^(Imgkeep|PNG|JPG|JPEG|WebP|GIF|PDF|AVIF|ICO|BMP|SVG|HEX|RGB|HSL|JSON|Tailwind|CSS|\d+|[\W\d_]+|helloimgkeep@gmail\.com)$/u;
const hasWords = (text) => /\p{L}{2,}/u.test(text) && !KEEP.test(text.trim());

const textOf = (node) => (node.nodeName === "#text" ? node.value : (node.childNodes || []).map(textOf).join(""));
const hasBlock = (node) => (node.childNodes || []).some((c) => BLOCK.has(c.tagName) || hasBlock(c));

// Returns the page's segments: { start, end, source, kind } (offsets into the HTML), plus JSON-LD blocks.
export function segmentsOf(html) {
  const doc = parse(html, { sourceCodeLocationInfo: true });
  const out = [];
  const ld = [];
  const inner = (el) => ({ start: el.sourceCodeLocation.startTag.endOffset, end: el.sourceCodeLocation.endTag?.startOffset });
  function attrs(el) {
    for (const { name, value } of el.attrs || []) {
      const loc = el.sourceCodeLocation?.attrs?.[name];
      if (!loc || !hasWords(value)) continue;
      const isMeta = el.tagName === "meta" && name === "content" && META.has(el.attrs.find((a) => a.name === "name" || a.name === "property")?.value);
      if (!ATTRS.includes(name) && !isMeta) continue;
      const raw = html.slice(loc.startOffset, loc.endOffset);
      const q = raw.indexOf('"');
      if (q < 0) continue;
      out.push({ start: loc.startOffset + q + 1, end: loc.endOffset - 1, source: html.slice(loc.startOffset + q + 1, loc.endOffset - 1), kind: isMeta ? `meta:${el.attrs.find((a) => a.name === "name" || a.name === "property").value}` : "attr" });
    }
  }
  function walk(node, inSegment = false) {
    if (node.tagName === "script" && node.attrs?.some((a) => a.name === "type" && a.value === "application/ld+json")) {
      const { start, end } = inner(node);
      ld.push({ start, end, json: html.slice(start, end) });
      return;
    }
    if (SKIP.has(node.tagName)) return;
    if (node.tagName) attrs(node);
    if (inSegment) {
      for (const c of node.childNodes || []) walk(c, true);
      return;
    }
    const direct = (node.childNodes || []).some((c) => c.nodeName === "#text" && c.value.trim());
    if (node.tagName && node.sourceCodeLocation?.endTag && !hasBlock(node) && (BLOCK.has(node.tagName) || direct) && hasWords(textOf(node))) {
      const { start, end } = inner(node);
      // Readable attributes inside (alt, aria-label…) are translated with the segment's HTML, not separately.
      out.push({ start, end, source: html.slice(start, end), kind: node.tagName === "title" ? "title" : "html" });
      return;
    }
    for (const c of node.childNodes || []) walk(c, false);
  }
  walk(doc);
  return { segments: out, ld };
}

// JSON-LD: the readable strings, by path, so they can be translated and put back.
function ldStrings(obj, path = [], out = []) {
  if (Array.isArray(obj)) obj.forEach((v, i) => ldStrings(v, [...path, i], out));
  else if (obj && typeof obj === "object") for (const [k, v] of Object.entries(obj)) ldStrings(v, [...path, k], out);
  else if (typeof obj === "string" && path.some((p) => LD_KEYS.has(p)) && hasWords(obj) && !/^https?:/.test(obj)) out.push({ path, source: obj });
  return out;
}

// The strings the converter and palette tool write themselves: t("…") in their app.js.
async function appStrings(app) {
  const js = await readFile(join(SITE, app), "utf8");
  return [...js.matchAll(/\bt\("((?:[^"\\]|\\.)*)"/g)].map((m) => JSON.parse(`"${m[1]}"`)).filter((s, i, a) => a.indexOf(s) === i);
}

// Inline icons (<svg>…</svg>) are sent as short placeholders and put back afterwards, so Claude never has to
// copy drawing code.
export function mask(source) {
  const svgs = [];
  const masked = source.replace(/<svg\b[\s\S]*?<\/svg>/g, (m) => `<svg data-k="${svgs.push(m) - 1}"></svg>`);
  return { masked, svgs };
}
export const unmask = (text, svgs) => text.replace(/<svg data-k="(\d+)"><\/svg>/g, (m, i) => svgs[Number(i)] ?? m);

// ---- Checks for a translated segment ----

const tagsOf = (s) => (s.match(/<\/?[a-z][a-z0-9]*\b[^>]*>/gi) || []).map((t) => t.replace(/\s+(?!href=)[a-z-]+="[^"]*"/gi, "")).sort().join(" ");
const placeholders = (s) => (s.match(/\{\w+\}/g) || []).sort().join(" ");
const LIMITS = { title: 60, "meta:description": 160, "meta:og:description": 160 };

export function problemsWith(source, text, kind) {
  const out = [];
  if (typeof text !== "string" || !text.trim()) return ["empty"];
  if (tagsOf(text) !== tagsOf(source)) out.push(`keep exactly these inline tags and links: ${tagsOf(source) || "none"}`);
  if (placeholders(text) !== placeholders(source)) out.push(`keep exactly these placeholders: ${placeholders(source) || "none"}`);
  if (LIMITS[kind] && [...text].length > LIMITS[kind]) out.push(`at most ${LIMITS[kind]} characters (now ${[...text].length})`);
  return out;
}

// ---- Claude ----

const STYLE = `You translate imgkeep.app, the website of Imgkeep: a free, open-source browser extension that saves images in the format you choose (PNG, JPG, WebP, GIF, PDF, AVIF, ICO, BMP), copies them, and shows an image's colour palette, all on the user's own computer, plus free in-browser tools (an image converter and a color palette tool) that never upload images.

How to translate:
- Write what a native speaker would write on a good product website: natural, clear, plain. Not word for word. Keep the English tone: friendly, direct, no hype, no exclamation marks.
- Each segment is the inner HTML of one paragraph, heading, list item, button or similar. Translate the text and keep the HTML: the same tags, in an order that reads naturally. Translate the readable attributes alt, title and aria-label; keep every other attribute (href, src, class, id, data-*) exactly. Don't add or drop tags.
- Keep unchanged: Imgkeep; format names (PNG, JPG, JPEG, WebP, GIF, PDF, AVIF, ICO, BMP, SVG, APNG, JFIF, HEIC, HEX, RGB, HSL, CSS, JSON, Tailwind, .gpl, .ase); product names (Chrome, Google Chrome, Microsoft Edge, Edge, Firefox, Safari, Chrome Web Store, GIMP, Inkscape, Krita, Adobe, Illustrator, Photoshop, InDesign, Canva, Figma, Google Slides, Instagram, Pinterest, Facebook, X, Paint, Preview, PostHog, GitHub); file-name tokens like {name}; URLs; email addresses; keyboard keys (Ctrl+V, ⌘V).
- Keep placeholders in curly braces, like {name} or {format}, exactly.
- When the English quotes one of the extension's menu items or buttons, use this language's name for it from the glossary, exactly.
- A segment of kind "title" is a page title for search results: at most 60 characters. "meta:description" is the search snippet: at most 160 characters.`;

async function apiKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const file = join(homedir(), ".config", "imgkeep", "anthropic.env");
  const line = (await readFile(file, "utf8")).split("\n").find((l) => l.startsWith("ANTHROPIC_API_KEY="));
  return line.slice("ANTHROPIC_API_KEY=".length).trim();
}

const GLOSSARY_KEYS = ["menuParent", "menuPalette", "menuCopyPng", "menuMoreOptions", "menuFindImage", "menuOriginal", "menuGif", "optCountsTitle", "askSaveOriginal", "askAllowAndSave", "paletteSaveGpl", "paletteSaveAse", "paletteSavePng", "editTitle", "optModeFolder"];
async function glossary(lang) {
  // The extension's own translations; until the 50-language release is merged, from its release branch.
  const read = async (l) => {
    const file = join(ROOT, "extension", "_locales", l, "messages.json");
    if (existsSync(file)) return JSON.parse(await readFile(file, "utf8"));
    return JSON.parse(execFileSync("git", ["show", `release/0.12.0:extension/_locales/${l}/messages.json`], { cwd: ROOT, encoding: "utf8" }));
  };
  const [en, xx] = await Promise.all([read("en"), read(SITE_LANGS[lang].ext)]);
  return Object.fromEntries(GLOSSARY_KEYS.filter((k) => en[k] && xx[k]).map((k) => [en[k].message, xx[k].message]));
}

function request(lang, items, terms, extra = "") {
  const ids = items.map((_, i) => `s${i + 1}`);
  const payload = Object.fromEntries(items.map((it, i) => [ids[i], ["html", "attr", "ld", "app"].includes(it.kind) ? mask(it.source).masked : { kind: it.kind, text: it.source }]));
  return {
    model: MODEL,
    max_tokens: 64000,
    system: [{ type: "text", text: STYLE, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: [
          `Translate into ${SITE_LANGS[lang].english}${SITE_LANGS[lang].rtl ? " (written right to left)" : ""}.`,
          `Glossary, the extension's own names in this language (English → ${SITE_LANGS[lang].english}):\n${JSON.stringify(terms, null, 1)}`,
          `Segments (some carry a kind; translate their text):\n${JSON.stringify(payload, null, 1)}`,
          extra,
          "Return JSON with every id above and its translation (just the translated text or inner HTML).",
        ].filter(Boolean).join("\n\n"),
      },
    ],
    output_config: { format: { type: "json_schema", schema: { type: "object", properties: Object.fromEntries(ids.map((id) => [id, { type: "string" }])), required: ids, additionalProperties: false } } },
  };
}

const answer = (message) => {
  if (message.stop_reason === "refusal") throw new Error("declined");
  if (message.stop_reason === "max_tokens") throw new Error("cut off");
  return JSON.parse(message.content.find((b) => b.type === "text")?.text || "{}");
};

// ---- Building the pages ----

const LANG_LIST = Object.keys(SITE_LANGS);
const toUrl = (lang, path) => (lang === "en" ? path : `/${lang}${path}`);

// href/src/poster values: to the translated page if this language has it, else to the English file.
function relink(html, enPath, lang) {
  const pages = new Set(SITE_PAGES.map(urlPath));
  return html.replace(/\b(href|src|poster)="([^"]*)"/g, (m, attr, value) => {
    if (/^(https?:|mailto:|data:|#|\/\/|javascript:)/i.test(value)) return m;
    const u = new URL(value, ORIGIN + enPath);
    const path = u.pathname.replace(/index\.html$/, "");
    const target = attr === "href" && pages.has(path) ? toUrl(lang, path) : u.pathname;
    return `${attr}="${target}${u.search}${u.hash}"`;
  });
}

function setLd(obj, path, value) {
  let o = obj;
  for (const p of path.slice(0, -1)) o = o[p];
  o[path.at(-1)] = value;
}

function relinkLd(obj, lang) {
  const pages = new Set(SITE_PAGES.map(urlPath));
  const walk = (o, key) => {
    if (Array.isArray(o)) return o.map((v) => walk(v, key));
    if (o && typeof o === "object") return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, walk(v, k)]));
    if (typeof o === "string" && ["url", "item"].includes(key) && o.startsWith(ORIGIN)) {
      const u = new URL(o);
      if (pages.has(u.pathname)) return ORIGIN + toUrl(lang, u.pathname) + u.hash;
    }
    return o;
  };
  return walk(obj);
}

const HREFLANG = /\n?\s*<!-- hreflang -->[\s\S]*?<!-- \/hreflang -->/;
const MENU = /\n?\s*<!-- lang-menu -->[\s\S]*?<!-- \/lang-menu -->/;

function alternates(path) {
  const links = [`<link rel="alternate" hreflang="en" href="${ORIGIN}${path}">`, ...LANG_LIST.map((l) => `<link rel="alternate" hreflang="${SITE_LANGS[l].hreflang}" href="${ORIGIN}${toUrl(l, path)}">`), `<link rel="alternate" hreflang="x-default" href="${ORIGIN}${path}">`];
  return `\n  <!-- hreflang -->\n  ${links.join("\n  ")}\n  <script src="/lang.js" defer></script>\n  <!-- /hreflang -->`;
}

function menu(path, current) {
  const items = [["en", "English"], ...LANG_LIST.map((l) => [l, SITE_LANGS[l].name])]
    .map(([l, name]) => `<li><a href="${toUrl(l, path)}" hreflang="${l === "en" ? "en" : SITE_LANGS[l].hreflang}" lang="${l === "en" ? "en" : SITE_LANGS[l].hreflang}"${l === current ? ' aria-current="true"' : ""}>${name}</a></li>`)
    .join("");
  const label = current === "en" ? "EN" : current.toUpperCase().replace("PT-BR", "PT");
  return `\n      <!-- lang-menu --><details class="lang-menu"><summary aria-label="Language">${label}</summary><ul>${items}</ul></details><!-- /lang-menu -->`;
}

// Adds hreflang, lang.js and the language menu to an English (or translated) page.
function withLanguageParts(html, path, lang) {
  html = html.replace(HREFLANG, "").replace(MENU, "");
  html = html.replace(/(<link rel="canonical" href="[^"]*">)/, `$1${alternates(path)}`);
  return html.replace(/(\n\s*<\/header>)/, `${menu(path, lang)}$1`);
}

async function buildPage(file, lang, cache, strings) {
  const enPath = urlPath(file);
  let html = await readFile(join(SITE, file), "utf8");
  html = html.replace(HREFLANG, "").replace(MENU, "");
  const { segments, ld } = segmentsOf(html);
  const edits = [];
  for (const s of segments) {
    const t = cache[hash(s.source)];
    if (t) edits.push({ start: s.start, end: s.end, text: s.kind === "attr" || s.kind.startsWith("meta:") ? t.replace(/"/g, "&quot;") : t });
  }
  for (const block of ld) {
    let obj;
    try {
      obj = JSON.parse(block.json);
    } catch {
      continue;
    }
    for (const { path, source } of ldStrings(obj)) if (cache[hash(source)]) setLd(obj, path, cache[hash(source)]);
    edits.push({ start: block.start, end: block.end, text: `\n  ${JSON.stringify(relinkLd(obj, lang))}\n  ` });
  }
  edits.sort((a, b) => b.start - a.start);
  for (const e of edits) html = html.slice(0, e.start) + e.text + html.slice(e.end);

  const info = SITE_LANGS[lang];
  html = html.replace('<html lang="en">', `<html lang="${info.hreflang}"${info.rtl ? ' dir="rtl"' : ""}>`);
  html = relink(html, enPath, lang);
  const url = ORIGIN + toUrl(lang, enPath);
  html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`).replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  const app = appFor(enPath);
  if (app) {
    const table = Object.fromEntries(strings[app].filter((s) => cache[hash(s)]).map((s) => [s, cache[hash(s)]]));
    html = html.replace(`<script type="module" src="/${app}"></script>`, `<script type="application/json" id="strings">${JSON.stringify(table).replace(/</g, "\\u003c")}</script>\n  <script type="module" src="/${app}"></script>`);
  }
  html = withLanguageParts(html, enPath, lang);
  const out = join(SITE, lang, file);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, html);
}

async function sitemap() {
  const file = join(SITE, "sitemap.xml");
  let xml = (await readFile(file, "utf8")).replace(/\n  <!-- translated -->[\s\S]*?<!-- \/translated -->/, "");
  const today = new Date().toISOString().slice(0, 10);
  const entries = LANG_LIST.flatMap((l) => SITE_PAGES.map((f) => `  <url>\n    <loc>${ORIGIN}${toUrl(l, urlPath(f))}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`));
  xml = xml.replace("</urlset>", `  <!-- translated -->\n${entries.join("\n")}\n  <!-- /translated -->\n</urlset>`);
  await writeFile(file, xml);
}

// ---- Main ----

const args = process.argv.slice(2);
const run = args.includes("--run");
const batch = args.includes("--batch");
const buildOnly = args.includes("--build");
// --only=es,fr: translate and build just these (for trying a change; the hreflang lists still name all).
const only = args.find((a) => a.startsWith("--only="))?.slice(7).split(",");
const WORK_LANGS = only ? LANG_LIST.filter((l) => only.includes(l)) : LANG_LIST;

if (import.meta.url === `file://${process.argv[1]}`) {
  // Everything to translate, once per English text.
  const all = new Map(); // hash → { source, kind }
  const strings = {};
  for (const file of SITE_PAGES) {
    const html = (await readFile(join(SITE, file), "utf8")).replace(HREFLANG, "").replace(MENU, "");
    const { segments, ld } = segmentsOf(html);
    for (const s of segments) all.set(hash(s.source), { source: s.source, kind: s.kind === "attr" ? "attr" : s.kind });
    for (const b of ld) {
      try {
        for (const { source } of ldStrings(JSON.parse(b.json))) all.set(hash(source), { source, kind: "ld" });
      } catch {}
    }
  }
  for (const app of new Set(Object.values(APP_SCRIPTS))) {
    strings[app] = await appStrings(app);
    for (const s of strings[app]) all.set(hash(s), { source: s, kind: "app" });
  }
  await mkdir(CACHE, { recursive: true });
  const caches = {};
  for (const l of LANG_LIST) caches[l] = existsSync(join(CACHE, `${l}.json`)) ? JSON.parse(await readFile(join(CACHE, `${l}.json`), "utf8")) : {};
  const todo = Object.fromEntries(LANG_LIST.map((l) => [l, [...all.entries()].filter(([h]) => !caches[l][h]).map(([h, v]) => ({ hash: h, ...v }))]));
  const chars = LANG_LIST.reduce((n, l) => n + todo[l].reduce((m, it) => m + it.source.length, 0), 0);
  console.log(`${all.size} English segments on ${SITE_PAGES.length} pages; ${LANG_LIST.length} languages.`);
  for (const l of LANG_LIST) console.log(`  ${l.padEnd(6)} ${String(todo[l].length).padStart(4)} to translate`);
  const inTok = Math.round(chars / 3.5 + LANG_LIST.length * 3000), outTok = Math.round((chars / 3.5) * 1.5);
  console.log(`Estimate with ${MODEL}: ~${inTok.toLocaleString()} tokens in, ~${outTok.toLocaleString()} out, about $${((inTok * 5 + outTok * 25) / 1e6).toFixed(2)} (half with --batch).`);

  if (run) {
    const client = new Anthropic({ apiKey: await apiKey() });
    const work = [];
    for (const l of WORK_LANGS) {
      const terms = await glossary(l);
      for (let i = 0; i < todo[l].length; i += CHUNK) {
        const items = todo[l].slice(i, i + CHUNK);
        work.push({ id: `${l}-${i / CHUNK}`, lang: l, items, terms, params: request(l, items, terms) });
      }
    }
    const results = new Map();
    if (batch && work.length) {
      const created = await client.messages.batches.create({ requests: work.map((w) => ({ custom_id: w.id, params: w.params })) });
      console.log(`Batch ${created.id}: ${work.length} requests. Waiting…`);
      let b = created;
      while (b.processing_status !== "ended") {
        await new Promise((r) => setTimeout(r, 30_000));
        b = await client.messages.batches.retrieve(created.id);
        console.log(`  ${b.request_counts.succeeded} done, ${b.request_counts.processing} in progress`);
      }
      for await (const r of await client.messages.batches.results(created.id)) {
        if (r.result.type === "succeeded") {
          try {
            results.set(r.custom_id, answer(r.result.message));
          } catch (e) {
            console.log(`  ${r.custom_id}: ${e.message}`);
          }
        }
      }
    }
    const live = (params) => client.beta.messages.stream({ ...params, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" }).finalMessage().then(answer);
    const queue = work.filter((w) => !results.has(w.id));
    await Promise.all(Array.from({ length: 4 }, async () => {
      for (let w; (w = queue.shift()); ) {
        try {
          results.set(w.id, await live(w.params));
        } catch (e) {
          console.log(`  ${w.id}: ${e.message}`);
        }
      }
    }));
    for (const w of work) {
      const res = results.get(w.id);
      if (!res) continue;
      let bad = [];
      w.items.forEach((it, i) => {
        const text = res[`s${i + 1}`];
        const { masked, svgs } = mask(it.source);
        const problems = problemsWith(masked, text, it.kind);
        if (problems.length) bad.push({ it, problems });
        else caches[w.lang][it.hash] = unmask(text, svgs);
      });
      if (bad.length) {
        const items = bad.map((b) => b.it);
        const fix = bad.map((b, i) => `s${i + 1}: ${b.problems.join("; ")}`).join("\n");
        try {
          const again = await live(request(w.lang, items, w.terms, `A previous attempt broke these rules; fix them:\n${fix}`));
          bad = [];
          items.forEach((it, i) => {
            const text = again[`s${i + 1}`];
            const { masked, svgs } = mask(it.source);
            if (problemsWith(masked, text, it.kind).length) bad.push({ it });
            else caches[w.lang][it.hash] = unmask(text, svgs);
          });
        } catch (e) {
          console.log(`  ${w.id} retry: ${e.message}`);
        }
      }
      console.log(`${w.id}: ${w.items.length - bad.length} of ${w.items.length} saved${bad.length ? ` (${bad.length} stay English)` : ""}`);
    }
    // Keep only translations of English that still exists.
    for (const l of LANG_LIST) {
      const kept = Object.fromEntries(Object.entries(caches[l]).filter(([h]) => all.has(h)).sort(([a], [b]) => a.localeCompare(b)));
      await writeFile(join(CACHE, `${l}.json`), JSON.stringify(kept, null, 1) + "\n");
      caches[l] = kept;
    }
  }

  if (run || buildOnly) {
    for (const l of WORK_LANGS) for (const f of SITE_PAGES) await buildPage(f, l, caches[l], strings);
    // English pages list their translations too.
    for (const f of SITE_PAGES) {
      const p = join(SITE, f);
      await writeFile(p, withLanguageParts(await readFile(p, "utf8"), urlPath(f), "en"));
    }
    await sitemap();
    console.log(`Built ${WORK_LANGS.length * SITE_PAGES.length} translated pages. Run npm test.`);
  } else console.log("Nothing sent. Add --run to translate, or --build to rebuild from saved translations.");
}
