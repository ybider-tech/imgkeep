// Shared bits of the extension's small windows (ask, copy, editor).

import { t, richText } from "./i18n.js";

// Error codes → message keys in _locales/*/messages.json.
const ERRORS = {
  blocked: "askErrBlocked",
  http: "askErrHttp",
  decode: "askErrDecode",
  unsupported: "askErrUnsupported",
  blob: "askErrBlob",
  "too-large": "askErrTooLarge",
  timeout: "askErrTimeout",
  download: "askErrDownload",
  write: "askErrWrite",
  expired: "askErrExpired",
  unknown: "askErrUnknown",
};
export const errorText = (code) => t(ERRORS[code] || ERRORS.unknown);

// Extra detail under an error: a message key from the converter ("@key" plus values),
// an HTTP status, or the browser's own error text.
export function detailText(job) {
  if (!job.detail) return "";
  if (job.detail.startsWith("@")) return t(job.detail.slice(1), job.detailSubs);
  return job.code === "http" ? `HTTP ${job.detail}` : job.detail;
}

export function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

export const isHttp = (url) => /^https?:/i.test(url || "");

// Sends a request about this window's job to the service worker.
export const ask = (jobId, type, extra = {}) => chrome.runtime.sendMessage({ target: "background", type, jobId, ...extra });

// "Allow images from this site?" — the explanation, for windows that show it inline.
export function hostExplanation(host) {
  return [el("p", {}, ...richText("askHostBody", host)), el("p", { className: "muted", textContent: t("askHostNote") })];
}

// 123456 bytes → "123 KB" in the browser's language. 1 KB = 1,000 bytes, 1 MB = 1,000,000 bytes.
export function formatBytes(bytes) {
  const lang = chrome.i18n.getUILanguage();
  const [value, unit] = bytes >= 1e6 ? [bytes / 1e6, "megabyte"] : bytes >= 1e3 ? [bytes / 1e3, "kilobyte"] : [bytes, "byte"];
  const digits = value < 10 && unit !== "byte" ? 1 : 0;
  return new Intl.NumberFormat(lang, { style: "unit", unit, maximumFractionDigits: digits }).format(value);
}

// 1600 × 800, with digits in the browser's language.
export function formatSize(width, height) {
  const n = new Intl.NumberFormat(chrome.i18n.getUILanguage());
  return `${n.format(width)} × ${n.format(height)}`;
}

// data: URL → Blob, without a network call.
export { dataUrlToBlob } from "./folder.js";

// Puts a PNG on the clipboard. The clipboard is only touched by this one write, so on failure it keeps
// whatever was there. Needs a focused window: the extension's own windows open focused.
export async function copyPng(blob) {
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

// The one rating ask: a short note with "Rate Imgkeep" and "No thanks". Either answer ends it for good.
// onAnswer(action) runs after the answer is recorded ("rate" also opened the store's review page).
export function reviewAsk(onAnswer) {
  const box = el("div", { className: "review" });
  box.setAttribute("role", "group");
  box.setAttribute("aria-label", t("reviewTitle"));
  const answer = (action) => async () => {
    for (const b of box.querySelectorAll("button")) b.disabled = true;
    await chrome.runtime.sendMessage({ target: "background", type: "review", action });
    box.replaceChildren(el("p", { textContent: action === "rate" ? t("reviewThanks") : t("reviewOk") }));
    onAnswer?.(action);
  };
  const rate = el("button", { type: "button", className: "primary", textContent: t("reviewRate") });
  const no = el("button", { type: "button", textContent: t("reviewNo") });
  rate.addEventListener("click", answer("rate"));
  no.addEventListener("click", answer("no"));
  box.append(el("p", {}, el("strong", { textContent: t("reviewTitle") }), " ", t("reviewBody")), el("div", { className: "actions" }, rate, no));
  return box;
}

// Asks the service worker whether this is the moment for the one rating ask.
export async function maybeReviewAsk() {
  const res = await chrome.runtime.sendMessage({ target: "background", type: "shouldAskRating" }).catch(() => null);
  return Boolean(res?.show);
}
