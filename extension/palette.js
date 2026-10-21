// Get colour palette: the main colours of the image the user right-clicked. Click one to copy it, copy them
// all as code, or save them as a file. The colours are worked out in the offscreen document (lib/palette.js);
// this window only shows them. Text goes on the clipboard from this focused window, so no clipboard permission.

import { t, localisePage } from "./lib/i18n.js";
import { colourText, paletteCode } from "./lib/palette.js";
import { ask, detailText, el, errorText, hostExplanation, isHttp, maybeReviewAsk, reviewAsk } from "./lib/ui.js";

const jobId = new URLSearchParams(location.search).get("job");
const $ = (id) => document.getElementById(id);
const toBackground = (type, extra) => ask(jobId, type, extra);
const COUNTS = ["5", "8", "12"];
const FORMATS = ["hex", "rgb", "hsl"];
const CODE_LABELS = { css: "paletteCodeCss", tailwind: "paletteCodeTailwind", json: "paletteCodeJson", list: "paletteCodeList" };

let job = null;
let palettes = null; // { 5: [{ hex, rgb, share }], 8: […], 12: […] }
let finished = false;

const checked = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value;
const current = () => palettes?.[checked("count")] || [];
const format = () => checked("format") || "hex";
const percent = (share) => new Intl.NumberFormat(chrome.i18n.getUILanguage(), { style: "percent", maximumFractionDigits: share < 0.01 ? 1 : 0 }).format(share);

function status(text, isError = false) {
  $("status").textContent = text;
  $("status").className = isError ? "error" : "";
}

function render() {
  const colours = current();
  $("bar").replaceChildren(...colours.map((c) => el("span", { style: `flex: ${c.share}; background: ${c.hex}` })));
  $("swatches").replaceChildren(
    ...colours.map((c, i) => {
      const value = colourText(c.hex, format());
      const label = t("paletteCopyOne", [value, percent(c.share)]);
      const b = el(
        "button",
        { type: "button", className: "swatch", title: label },
        el("span", { className: "chip" }),
        el("bdi", { className: "value mono", dir: "ltr", textContent: value }),
      );
      b.style.setProperty("--c", c.hex);
      b.setAttribute("aria-label", label);
      b.dataset.index = String(i);
      b.addEventListener("click", () => copyOne(b, value));
      return el("li", {}, b);
    }),
  );
}

async function writeText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    status(t("paletteCopyFailed"), true);
    return false;
  }
}

async function copyOne(button, value) {
  if (!(await writeText(value))) return;
  for (const b of $("swatches").querySelectorAll(".copied")) b.classList.remove("copied");
  button.classList.add("copied");
  status(t("paletteCopied", [value]));
  toBackground("count", { key: "palette_copy_one" }).catch(() => {});
  offerReview();
}

async function copyAll(kind) {
  const code = paletteCode(current().map((c) => c.hex), kind, format());
  if (!(await writeText(code))) return;
  status(t("paletteCopiedAll", [t(CODE_LABELS[kind])]));
  toBackground("count", { key: "palette_copy_all" }).catch(() => {});
  offerReview();
}

async function save(kind) {
  const buttons = document.querySelectorAll("[data-save]");
  for (const b of buttons) b.disabled = true;
  status(t("askSaving"));
  const res = await toBackground("savePalette", { kind, hexes: current().map((c) => c.hex) }).catch((e) => ({ ok: false, code: "unknown", detail: e.message }));
  for (const b of buttons) b.disabled = false;
  if (!res?.ok) return status(`${t("askErrorTitle")} ${errorText(res?.code)}`, true);
  const where = res.path || res.filename;
  status(res.folderFallback ? t("paletteSavedFallback", [where]) : where ? t("askSavedAs", [where]) : t("askSaved"));
  offerReview();
}

// The one rating ask, under the status line, if it's due.
async function offerReview() {
  if (!$("review").childElementCount && (await maybeReviewAsk())) $("review").append(reviewAsk());
}

function showProblem(res) {
  const nodes = [];
  if (res.reason === "host") {
    const allow = el("button", { type: "button", className: "primary", textContent: t("editAllow") });
    allow.addEventListener("click", async () => {
      const granted = await chrome.permissions.request({ origins: [res.origin] });
      if (granted) toBackground("count", { key: "site_access_allowed" }).catch(() => {});
      if (!granted) return status(t("askNotAllowed"), true);
      $("problem").hidden = true;
      load();
    });
    nodes.push(el("h2", { textContent: t("askHostTitle") }), ...hostExplanation(res.host), allow);
  } else {
    nodes.push(el("h2", { className: "error", textContent: t("askErrorTitle") }), el("p", { textContent: errorText(res.code) }));
    const extra = detailText(res);
    if (extra) nodes.push(el("p", { className: "muted detail", textContent: extra }));
    const row = el("div", { className: "row" });
    const retry = el("button", { type: "button", textContent: t("askRetry") });
    retry.addEventListener("click", () => (($("problem").hidden = true), load()));
    row.append(retry);
    if (isHttp(job?.url)) {
      const open = el("button", { type: "button", textContent: t("askOpenImage") });
      open.addEventListener("click", () => toBackground("openSource"));
      row.append(open);
    }
    nodes.push(row);
  }
  $("problem").replaceChildren(...nodes);
  $("problem").hidden = false;
  $("problem").querySelector("button")?.focus();
}

async function load() {
  $("stage").setAttribute("aria-busy", "true");
  $("stageNote").hidden = false;
  $("stageNote").textContent = t("paletteLoading");
  const res = await toBackground("palette").catch((e) => ({ ok: false, code: "unknown", detail: e.message }));
  $("stage").setAttribute("aria-busy", "false");
  $("stageNote").hidden = true;
  if (!res?.ok) return showProblem(res || { code: "unknown" });
  if (res.thumb) {
    $("thumb").src = res.thumb;
    $("thumb").hidden = false;
  }
  palettes = res.palettes;
  if (!palettes?.["5"]?.length) {
    $("problem").replaceChildren(el("p", { textContent: t("paletteEmpty") }));
    $("problem").hidden = false;
    return;
  }
  $("tools").hidden = false;
  render();
}

// Arrow keys move between colours (in reading order, so right-to-left in Arabic and Hebrew); Enter copies.
function onKey(e) {
  if (e.key === "Escape") return close();
  const swatch = e.target.closest?.(".swatch");
  if (!swatch) return;
  const all = [...$("swatches").querySelectorAll(".swatch")];
  const rtl = document.documentElement.dir === "rtl";
  const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowDown: 1, ArrowUp: -1 }[e.key];
  if (!step) return;
  e.preventDefault();
  const next = all[(all.indexOf(swatch) + step + all.length) % all.length];
  next?.focus();
}

async function close() {
  finished = true;
  await toBackground("done").catch(() => {});
  window.close();
}

addEventListener("pagehide", () => {
  if (!finished && jobId) toBackground("done");
});

async function init() {
  localisePage();
  $("close").addEventListener("click", close);
  addEventListener("keydown", onKey);
  const res = await toBackground("job").catch(() => null);
  if (!res?.ok) {
    $("stageNote").textContent = t("askNothingTitle");
    $("problem").replaceChildren(el("p", { textContent: errorText("expired") }));
    $("problem").hidden = false;
    return;
  }
  job = res;
  const { lastPaletteCount, lastPaletteFormat } = await chrome.storage.local.get(["lastPaletteCount", "lastPaletteFormat"]).catch(() => ({}));
  document.querySelector(`input[name="count"][value="${COUNTS.includes(lastPaletteCount) ? lastPaletteCount : "5"}"]`).checked = true;
  document.querySelector(`input[name="format"][value="${FORMATS.includes(lastPaletteFormat) ? lastPaletteFormat : "hex"}"]`).checked = true;
  for (const radio of document.querySelectorAll('input[name="count"], input[name="format"]')) {
    radio.addEventListener("change", () => {
      chrome.storage.local.set({ lastPaletteCount: checked("count"), lastPaletteFormat: format() }).catch(() => {});
      status("");
      render();
    });
  }
  for (const b of document.querySelectorAll("[data-code]")) b.addEventListener("click", () => copyAll(b.dataset.code));
  for (const b of document.querySelectorAll("[data-save]")) b.addEventListener("click", () => save(b.dataset.save));
  await load();
}

init();
