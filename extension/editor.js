// More options: pick format, maximum width, quality, background and file name for one image,
// see the real result (dimensions, encoded size, the image itself), then Save or Copy as PNG.
// The preview comes from the same pipeline as every other save, so what you see is what you get.

import { t, localisePage } from "./lib/i18n.js";
import { buildTarget, cleanColour } from "./lib/settings.js";
import { cleanMaxWidth } from "./lib/image.js";
import { ask, copyPng, dataUrlToBlob, detailText, el, errorText, formatBytes, formatSize, hostExplanation, isHttp, maybeReviewAsk, reviewAsk } from "./lib/ui.js";

const jobId = new URLSearchParams(location.search).get("job");
const $ = (id) => document.getElementById(id);
const toBackground = (type, extra) => ask(jobId, type, extra);
const LABEL = { png: "PNG", jpg: "JPG", webp: "WebP" };
const LAST = "editorLast"; // the last format and width used here, in chrome.storage.local

let job = null; // { url, pageUrl, settings }
let result = null; // the latest preview: { width, height, ext, size, ... }
let previewUrl = "";
let nameEdited = false;
let previewRun = 0;
let finished = false;

const format = () => document.querySelector('input[name="format"]:checked')?.value || "png";

function options() {
  return {
    maxWidth: cleanMaxWidth($("maxWidth").value),
    quality: Number($("quality").value),
    background: cleanColour($("background").value),
    name: $("name").value,
  };
}

function status(text, isError = false) {
  $("status").textContent = text;
  $("status").className = isError ? "error" : "";
}

function setBusy(busy) {
  for (const id of ["save", "copy"]) $(id).disabled = busy || !result;
}

// Controls that only apply to some formats.
function syncControls() {
  const f = format();
  $("qualityField").hidden = f === "png";
  $("pngHint").hidden = f !== "png";
  $("backgroundField").hidden = f !== "jpg";
  const settings = job.settings;
  if (f !== "png" && !$("quality").dataset.touched) $("quality").value = f === "webp" ? settings.webpQuality : settings.jpgQuality;
  $("qualityOut").textContent = $("quality").value;
}

function showProblem(nodes) {
  $("problem").replaceChildren(...nodes);
  $("problem").hidden = !nodes.length;
}

function problemFor(res) {
  if (res.reason === "host") {
    const allow = el("button", { type: "button", className: "primary", textContent: t("editAllow") });
    allow.addEventListener("click", async () => {
      const granted = await chrome.permissions.request({ origins: [res.origin] });
      if (!granted) return status(t("askNotAllowed"), true);
      showProblem([]);
      preview();
    });
    return [el("h2", { textContent: t("askHostTitle") }), ...hostExplanation(res.host), allow];
  }
  const nodes = [el("h2", { className: "error", textContent: t("askErrorTitle") }), el("p", { textContent: errorText(res.code) })];
  const extra = detailText(res);
  if (extra) nodes.push(el("p", { className: "muted detail", textContent: extra }));
  const row = el("div", { className: "actions" });
  const retry = el("button", { type: "button", textContent: t("askRetry") });
  retry.addEventListener("click", () => (showProblem([]), preview()));
  row.append(retry);
  if (isHttp(job.url)) {
    const open = el("button", { type: "button", textContent: t("askOpenImage") });
    open.addEventListener("click", () => toBackground("openSource"));
    row.append(open);
  }
  nodes.push(row);
  return nodes;
}

// Converts with the current choices and shows the result. Older answers that arrive late are ignored.
async function preview() {
  const run = ++previewRun;
  $("stage").setAttribute("aria-busy", "true");
  $("stageNote").hidden = false;
  $("stageNote").textContent = result ? t("editUpdating") : t("editLoading");
  setBusy(true);
  const res = await toBackground("preview", { format: format(), options: options() }).catch((e) => ({ ok: false, code: "unknown", detail: e.message }));
  if (run !== previewRun) return;
  $("stage").setAttribute("aria-busy", "false");
  if (!res?.ok) {
    result = null;
    $("stageNote").hidden = true;
    $("resultFacts").textContent = "–";
    showProblem(problemFor(res || { code: "unknown" }));
    return setBusy(false);
  }
  showProblem([]);
  result = res;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(dataUrlToBlob(res.dataUrl));
  $("preview").src = previewUrl;
  $("preview").hidden = false;
  $("stageNote").hidden = true;
  $("sourceFacts").replaceChildren(isolate(formatSize(res.sourceWidth, res.sourceHeight)));
  // Format and extension come from the checked output bytes.
  const parts = [formatSize(res.width, res.height), LABEL[res.ext] || res.ext.toUpperCase(), formatBytes(res.size)];
  $("resultFacts").replaceChildren(...parts.flatMap((p, i) => (i ? [" · ", isolate(p)] : [isolate(p)])));
  $("ext").textContent = `.${res.ext}`;
  if (!nameEdited) {
    $("name").value = buildTarget({ settings: job.settings, url: job.url, width: res.width, height: res.height, ext: res.ext }).name;
  }
  setBusy(false);
}

// "1,600 × 800" stays in that order inside right-to-left text.
const isolate = (text) => el("bdi", { dir: "ltr", textContent: text });

let timer;
function previewSoon() {
  clearTimeout(timer);
  timer = setTimeout(preview, 250);
}

async function save() {
  setBusy(true);
  status(t("askSaving"));
  const choice = { format: format(), maxWidth: cleanMaxWidth($("maxWidth").value) };
  chrome.storage.local.set({ [LAST]: choice }).catch(() => {});
  const res = await toBackground("save", { format: format(), options: options() }).catch((e) => ({ ok: false, code: "unknown", detail: e.message }));
  setBusy(false);
  if (res?.ok) {
    status(res.path || res.filename ? t("askSavedAs", [res.path || res.filename]) : t("askSaved"));
    return offerReview();
  }
  // The ask window opened to sort it out (site access, folder, or an error).
  status(t("editNeedsOk"));
}

async function copy() {
  setBusy(true);
  status(t("copyWorking"));
  try {
    const res = await toBackground("copy", { options: { maxWidth: options().maxWidth } });
    if (!res?.ok) {
      showProblem(problemFor(res || { code: "unknown" }));
      return status("");
    }
    await copyPng(dataUrlToBlob(res.dataUrl));
    status(t("copyDone"));
    await toBackground("copied").catch(() => {});
    offerReview();
  } catch (e) {
    status(`${t("copyFailed")} ${t("copyFailedNote")}`, true);
  } finally {
    setBusy(false);
  }
}

// The one rating ask, under the status line, if it's due.
async function offerReview() {
  if (!$("review").childElementCount && (await maybeReviewAsk())) $("review").append(reviewAsk());
}

async function close() {
  finished = true;
  await toBackground("done").catch(() => {});
  window.close();
}

// Closing the window with the ✕ also clears the job and its image.
addEventListener("pagehide", () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  if (!finished && jobId) toBackground("done");
});

async function init() {
  localisePage();
  setBusy(true);
  const res = await toBackground("job").catch(() => null);
  if (!res?.ok) {
    $("stageNote").textContent = t("askNothingTitle");
    showProblem([el("p", { textContent: errorText("expired") })]);
    $("form").hidden = true;
    return;
  }
  job = res;
  const { [LAST]: last = {} } = await chrome.storage.local.get(LAST).catch(() => ({}));
  const startFormat = LABEL[last.format] ? last.format : "png";
  document.querySelector(`input[name="format"][value="${startFormat}"]`).checked = true;
  const width = last.maxWidth ?? job.settings.maxWidth;
  $("maxWidth").value = width > 0 ? width : "";
  $("background").value = job.settings.jpgBackground;
  syncControls();

  for (const radio of document.querySelectorAll('input[name="format"]')) {
    radio.addEventListener("change", () => (syncControls(), preview()));
  }
  $("maxWidth").addEventListener("input", previewSoon);
  $("quality").addEventListener("input", () => {
    $("quality").dataset.touched = "1";
    $("qualityOut").textContent = $("quality").value;
    previewSoon();
  });
  $("background").addEventListener("input", previewSoon);
  $("name").addEventListener("input", () => (nameEdited = true));
  $("form").addEventListener("submit", (e) => (e.preventDefault(), save()));
  $("save").addEventListener("click", save);
  $("copy").addEventListener("click", copy);
  $("close").addEventListener("click", close);
  $("controls").disabled = false; // usable only now, so nothing typed earlier gets overwritten
  await preview();
}

init();
