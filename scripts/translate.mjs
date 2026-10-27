// Translates Imgkeep into every language the Chrome Web Store supports, with Claude (Anthropic API).
// Only what changed is sent: i18n/translations.lock.json remembers, per language, which English text each
// translation was made from, so a release re-translates new and edited strings and nothing else.
//
// What gets translated (English is the source; other languages are never edited by hand here):
//   ui      extension/_locales/en/messages.json  →  extension/_locales/<lang>/messages.json
//   store   store/i18n/en.json                   →  store/i18n/<lang>.json
//           (the store description, browser-neutral for Chrome and Edge; the Firefox summary and description)
//
//   node scripts/translate.mjs                   what would be translated, and roughly what it costs (no API call)
//   node scripts/translate.mjs --run             translate now (a few languages at a time)
//   node scripts/translate.mjs --run --batch     through the Message Batches API: half the price, done within ~1 hour
//   node scripts/translate.mjs --run --only=zh_CN,ko   just these languages
//
// Every result is checked before it's written: placeholders ($PATH$), file-name tokens ({name}), the only HTML
// allowed (<code>, <strong>), store length limits. A string that fails is retried once with the reason.
// Credentials: ANTHROPIC_API_KEY, or ~/.config/imgkeep/anthropic.env (ANTHROPIC_API_KEY=…). Never printed.
import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES_DIR = join(ROOT, "extension", "_locales");
const STORE_DIR = join(ROOT, "store", "i18n");
const LOCK = join(ROOT, "i18n", "translations.lock.json");
const MODEL = "claude-opus-5";

// The Chrome Web Store's languages (English variants and es_419, which falls back to es, left out).
export const LANGUAGES = {
  am: "Amharic", ar: "Arabic", bg: "Bulgarian", bn: "Bengali", ca: "Catalan", cs: "Czech", da: "Danish", de: "German",
  el: "Greek", es: "Spanish", et: "Estonian", fa: "Persian", fi: "Finnish", fil: "Filipino", fr: "French",
  gu: "Gujarati", he: "Hebrew", hi: "Hindi", hr: "Croatian", hu: "Hungarian", id: "Indonesian", it: "Italian",
  ja: "Japanese", kn: "Kannada", ko: "Korean", lt: "Lithuanian", lv: "Latvian", ml: "Malayalam", mr: "Marathi",
  ms: "Malay", nl: "Dutch", no: "Norwegian (Bokmål)", pl: "Polish", pt_BR: "Portuguese (Brazil)",
  pt_PT: "Portuguese (Portugal)", ro: "Romanian", ru: "Russian", sk: "Slovak", sl: "Slovenian", sr: "Serbian (Cyrillic)",
  sv: "Swedish", sw: "Swahili", ta: "Tamil", te: "Telugu", th: "Thai", tr: "Turkish", uk: "Ukrainian",
  vi: "Vietnamese", zh_CN: "Chinese (Simplified)", zh_TW: "Chinese (Traditional, Taiwan)",
};
export const RTL = ["ar", "fa", "he"];

// Store limits (characters).
const LIMITS = { extName: 75, extDescription: 132, amoSummary: 250 };

// ---- Checks (the same rules tests/static-check.mjs applies to every language) ----

const placeholders = (s) => (s.match(/\$[A-Z_]+\$/gi) || []).map((p) => p.toUpperCase()).sort().join(" ");
const tokens = (s) => (s.match(/\{(name|host|date|time|w|h)\}/g) || []).sort().join(" ");
const tags = (s) => (s.match(/<\/?[a-z]+>/gi) || []).sort().join(" ");

export function problemsWith(key, text, source) {
  const out = [];
  if (typeof text !== "string" || !text.trim()) return ["empty"];
  if (placeholders(text) !== placeholders(source)) out.push(`placeholders must be exactly: ${placeholders(source) || "none"}`);
  if (tokens(text) !== tokens(source)) out.push(`{tokens} must be exactly: ${tokens(source) || "none"}`);
  if (tags(text) !== tags(source)) out.push(`HTML tags must be exactly: ${tags(source) || "none"}`);
  if (/<(?!\/?(code|strong)>)/i.test(text)) out.push("only <code> and <strong> are allowed");
  if (/\$(?![A-Z_]+\$)/i.test(text.replace(/\$[A-Z_]+\$/gi, ""))) out.push('a stray "$" (write "$$" for a literal dollar)');
  if (LIMITS[key] && [...text].length > LIMITS[key]) out.push(`at most ${LIMITS[key]} characters (now ${[...text].length})`);
  return out;
}

// ---- Sources and what changed ----

const hash = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);
const readJson = async (p, fallback) => (existsSync(p) ? JSON.parse(await readFile(p, "utf8")) : fallback);

async function sources() {
  const ui = await readJson(join(LOCALES_DIR, "en", "messages.json"));
  const store = await readJson(join(STORE_DIR, "en.json"));
  return {
    ui: Object.fromEntries(Object.entries(ui).map(([k, v]) => [k, { text: v.message, note: v.description || "" }])),
    store: Object.fromEntries(Object.entries(store).filter(([k]) => !k.startsWith("_")).map(([k, v]) => [k, { text: v, note: STORE_NOTES[k] || "" }])),
  };
}

const STORE_NOTES = {
  storeDescription: "The extension's description on the Chrome Web Store and Edge Add-ons. Plain text. Keep the paragraph breaks, the CAPITALISED section headings (translate them; uppercase only where the language has case), the • bullets and the → arrows. Quote menu items exactly as the extension's own translation names them (glossary below).",
  amoSummary: "The one-paragraph summary on addons.mozilla.org (Firefox). At most 250 characters.",
  amoDescription: "The description on addons.mozilla.org (Firefox). Same rules as the store description.",
};

// What each language needs: keys missing there, or translated from English that has since changed.
async function plan(only) {
  const src = await sources();
  const lock = await readJson(LOCK, {});
  const jobs = [];
  for (const lang of Object.keys(LANGUAGES).filter((l) => !only || only.includes(l))) {
    const ui = await readJson(join(LOCALES_DIR, lang, "messages.json"), {});
    const store = await readJson(join(STORE_DIR, `${lang}.json`), {});
    const done = lock[lang] || {};
    const todo = (kind, have) =>
      Object.entries(src[kind]).filter(([k, v]) => have[k] === undefined || done[`${kind}:${k}`] !== hash(v.text)).map(([k]) => k);
    const uiKeys = todo("ui", Object.fromEntries(Object.entries(ui).map(([k, v]) => [k, v.message])));
    const storeKeys = todo("store", store);
    if (uiKeys.length || storeKeys.length) jobs.push({ lang, uiKeys, storeKeys });
  }
  return { src, lock, jobs };
}

// ---- Prompt ----

const STYLE = `You translate Imgkeep, a free, privacy-first browser extension that saves images in the format you choose (PNG, JPG, WebP, GIF, PDF, AVIF, ICO, BMP), copies them, and gets an image's colour palette, all on the user's computer.

How to translate:
- Write what a native speaker who designs good software would write: natural, short, plain. Not word for word. Match the English tone: friendly, direct, no hype.
- Keep these unchanged: Imgkeep; format and file names (PNG, JPG, JPEG, WebP, GIF, PDF, AVIF, ICO, BMP, SVG, APNG, JFIF, HEX, RGB, HSL, CSS, JSON, Tailwind, .gpl, .ase); product names (Chrome, Edge, Firefox, GIMP, Inkscape, Krita, Adobe, Illustrator, Photoshop, InDesign, Canva, Google Slides, Instagram, Pinterest, PostHog, Aptabase); permission names (contextMenus, downloads, storage, offscreen, activeTab, scripting); URLs and email addresses.
- Keep placeholders exactly as they are: $PATH$, $FORMAT$ and the like. Move them to wherever the sentence needs them.
- Keep file-name tokens exactly: {name}, {host}, {date}, {time}, {w}, {h}. Keep <code> and <strong> tags and their content's meaning; add no other HTML.
- Keep "…", "→", "•" and "✨" where the English has them. Use the language's own quotation marks.
- Strings marked as store limits must fit. The extension name and summary appear in store search: keep the format names in them, and no keyword lists.
- Use the same word for the same thing everywhere, and quote the extension's menu items and buttons exactly as this language's interface names them (see the glossary when given).`;

function prompt(lang, kind, keys, src, glossary) {
  const items = Object.fromEntries(keys.map((k) => [k, src[kind][k].text]));
  const notes = Object.fromEntries(keys.filter((k) => src[kind][k].note).map((k) => [k, src[kind][k].note]));
  const limits = Object.fromEntries(keys.filter((k) => LIMITS[k]).map((k) => [k, LIMITS[k]]));
  return [
    `Translate into ${LANGUAGES[lang]} (locale ${lang}${RTL.includes(lang) ? ", written right to left" : ""}).`,
    kind === "ui" ? "These are the extension's interface strings (menus, buttons, windows, the Options page)." : "These are store listing texts.",
    glossary && Object.keys(glossary).length ? `Glossary, this language's interface names to quote exactly:\n${JSON.stringify(glossary, null, 1)}` : "",
    Object.keys(limits).length ? `Character limits: ${JSON.stringify(limits)}` : "",
    `Notes for translators, per key:\n${JSON.stringify(notes, null, 1)}`,
    `English, per key:\n${JSON.stringify(items, null, 1)}`,
    "Return JSON with every key above and its translation.",
  ].filter(Boolean).join("\n\n");
}

const schema = (keys) => ({
  type: "object",
  properties: Object.fromEntries(keys.map((k) => [k, { type: "string" }])),
  required: keys,
  additionalProperties: false,
});

// The interface names a store text must quote exactly, in this language.
const GLOSSARY_KEYS = ["menuParent", "menuPalette", "menuCopyPng", "menuMoreOptions", "menuFindImage", "menuOriginal", "menuGif", "optCountsTitle", "optModeDownloads", "askSaveOriginal", "askAllowAndSave", "paletteSaveGpl", "paletteSaveAse"];
async function glossaryFor(lang) {
  const ui = await readJson(join(LOCALES_DIR, lang, "messages.json"), {});
  return Object.fromEntries(GLOSSARY_KEYS.filter((k) => ui[k]).map((k) => [k, ui[k].message]));
}

function request(lang, kind, keys, src, glossary) {
  return {
    model: MODEL,
    max_tokens: 64000,
    // The style guide is the same for every language: cached, so 50 languages pay for it about once.
    system: [{ type: "text", text: STYLE, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: prompt(lang, kind, keys, src, glossary) }],
    output_config: { format: { type: "json_schema", schema: schema(keys) } },
  };
}

// ---- Calling Claude ----

async function apiKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const file = join(homedir(), ".config", "imgkeep", "anthropic.env");
  if (!existsSync(file)) throw new Error(`Set ANTHROPIC_API_KEY or create ${file} with ANTHROPIC_API_KEY=…`);
  const line = (await readFile(file, "utf8")).split("\n").find((l) => l.startsWith("ANTHROPIC_API_KEY="));
  if (!line) throw new Error(`${file} has no ANTHROPIC_API_KEY=… line`);
  return line.slice("ANTHROPIC_API_KEY=".length).trim();
}

const textOf = (message) => {
  if (message.stop_reason === "refusal") throw new Error("Claude declined this request");
  if (message.stop_reason === "max_tokens") throw new Error("the answer was cut off (max_tokens)");
  return JSON.parse(message.content.find((b) => b.type === "text")?.text || "{}");
};

// Real-time: streamed (large answers), with server-side fallback to another model if one ever declines.
async function translateNow(client, params) {
  const stream = client.beta.messages.stream({ ...params, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" });
  return textOf(await stream.finalMessage());
}

// Checks every string; returns the good ones and the problems.
function check(kind, result, keys, src) {
  const good = {};
  const bad = {};
  for (const k of keys) {
    const problems = problemsWith(k, result[k], src[kind][k].text);
    if (problems.length) bad[k] = problems;
    else good[k] = result[k];
  }
  return { good, bad };
}

// ---- Writing results ----

async function save(lang, kind, translated, src, lock) {
  if (!Object.keys(translated).length) return;
  if (kind === "ui") {
    const file = join(LOCALES_DIR, lang, "messages.json");
    const current = await readJson(file, {});
    const en = await readJson(join(LOCALES_DIR, "en", "messages.json"));
    // English key order; descriptions and placeholders come from English (they're for translators and Chrome).
    const out = {};
    for (const [k, v] of Object.entries(en)) {
      const message = translated[k] ?? current[k]?.message;
      if (message === undefined) continue;
      out[k] = { message, ...(v.placeholders ? { placeholders: v.placeholders } : {}) };
    }
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(out, null, 2) + "\n");
  } else {
    const file = join(STORE_DIR, `${lang}.json`);
    const current = await readJson(file, {});
    await writeFile(file, JSON.stringify({ ...current, ...translated }, null, 2) + "\n");
  }
  lock[lang] ??= {};
  for (const k of Object.keys(translated)) lock[lang][`${kind}:${k}`] = hash(src[kind][k].text);
  await mkdir(dirname(LOCK), { recursive: true });
  const sorted = Object.fromEntries(Object.entries(lock).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(LOCK, JSON.stringify(sorted, null, 1) + "\n");
}

// ---- Main ----

const args = process.argv.slice(2);
const run = args.includes("--run");
const batch = args.includes("--batch");
const only = args.find((a) => a.startsWith("--only="))?.slice(7).split(",");

if (import.meta.url === `file://${process.argv[1]}`) {
  const { src, lock, jobs } = await plan(only);
  const chars = jobs.reduce((n, j) => n + [...j.uiKeys.map((k) => src.ui[k].text), ...j.storeKeys.map((k) => src.store[k].text)].join("").length, 0);
  console.log(`${jobs.length} languages need work, ${chars.toLocaleString()} English characters in all.`);
  for (const j of jobs) console.log(`  ${j.lang.padEnd(6)} ${String(j.uiKeys.length).padStart(4)} interface strings, ${j.storeKeys.length} store texts`);
  // About 4 characters a token in English; translations run longer, and each request carries instructions.
  const outTokens = Math.round((chars / 4) * 1.6);
  const inTokens = Math.round(chars / 4 + jobs.length * 2 * 1500);
  const dollars = (inTokens * 5 + outTokens * 25) / 1e6;
  console.log(`Estimate with ${MODEL}: ~${inTokens.toLocaleString()} tokens in, ~${outTokens.toLocaleString()} out, about $${dollars.toFixed(2)} (half with --batch), plus thinking.`);
  if (!run) {
    console.log("Nothing sent. Add --run to translate.");
    process.exit(0);
  }

  const client = new Anthropic({ apiKey: await apiKey() });
  // Interface strings first: the store texts quote the interface's names.
  for (const kind of ["ui", "store"]) {
    const work = [];
    for (const j of jobs) {
      const keys = kind === "ui" ? j.uiKeys : j.storeKeys;
      if (keys.length) work.push({ lang: j.lang, keys, params: request(j.lang, kind, keys, src, kind === "store" ? await glossaryFor(j.lang) : null) });
    }
    if (!work.length) continue;
    const results = new Map();
    if (batch) {
      const created = await client.messages.batches.create({ requests: work.map((w) => ({ custom_id: `${kind}-${w.lang}`, params: w.params })) });
      console.log(`Batch ${created.id}: ${work.length} ${kind} requests. Waiting (usually under an hour)…`);
      let b = created;
      while (b.processing_status !== "ended") {
        await new Promise((r) => setTimeout(r, 30_000));
        b = await client.messages.batches.retrieve(created.id);
        console.log(`  ${b.request_counts.succeeded} done, ${b.request_counts.processing} in progress`);
      }
      for await (const r of await client.messages.batches.results(created.id)) {
        const lang = r.custom_id.slice(kind.length + 1);
        if (r.result.type === "succeeded") {
          try {
            results.set(lang, textOf(r.result.message));
          } catch (e) {
            console.log(`  ${lang}: ${e.message}`);
          }
        } else console.log(`  ${lang}: ${r.result.type}, will retry live`);
      }
    }
    // Live (and anything the batch didn't finish), three languages at a time.
    const queue = work.filter((w) => !results.has(w.lang));
    await Promise.all(
      Array.from({ length: 3 }, async () => {
        for (let w; (w = queue.shift()); ) {
          try {
            results.set(w.lang, await translateNow(client, w.params));
          } catch (e) {
            console.log(`  ${w.lang}: ${e.message}`);
          }
        }
      }),
    );
    for (const w of work) {
      const result = results.get(w.lang);
      if (!result) continue;
      let { good, bad } = check(kind, result, w.keys, src);
      if (Object.keys(bad).length) {
        // One more try for the strings that broke a rule, telling Claude why.
        const keys = Object.keys(bad);
        const retry = request(w.lang, kind, keys, src, kind === "store" ? await glossaryFor(w.lang) : null);
        retry.messages[0].content += `\n\nA previous attempt broke these rules; fix them:\n${JSON.stringify(bad, null, 1)}`;
        try {
          const again = check(kind, await translateNow(client, retry), keys, src);
          good = { ...good, ...again.good };
          bad = again.bad;
        } catch (e) {
          console.log(`  ${w.lang} retry: ${e.message}`);
        }
      }
      await save(w.lang, kind, good, src, lock);
      const left = Object.keys(bad);
      console.log(`${kind} ${w.lang}: ${Object.keys(good).length} written${left.length ? `, ${left.length} still failing (kept English fallback): ${left.join(", ")}` : ""}`);
    }
  }
  console.log("Done. Run npm test before committing.");
}
