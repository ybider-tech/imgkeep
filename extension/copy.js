// Copy as PNG: converts the image the user right-clicked and puts it on the clipboard.
// It runs in this small window because the clipboard only accepts images from a focused page,
// which avoids asking for the clipboardWrite permission.

import { t, localisePage } from "./lib/i18n.js";
import { ask, copyPng, dataUrlToBlob, detailText, el, errorText, hostExplanation, isHttp, maybeReviewAsk, reviewAsk } from "./lib/ui.js";

const jobId = new URLSearchParams(location.search).get("job");
const $ = (id) => document.getElementById(id);
const toBackground = (type, extra) => ask(jobId, type, extra);

let png = null; // the converted image, kept so "Try again" doesn't convert twice
let url = "";
let finished = false;

function show({ title = t("menuCopyPng"), status = "", error = false, body = [], actions = [] }) {
  $("title").textContent = title;
  $("status").textContent = status;
  $("status").className = error ? "error" : "";
  $("body").replaceChildren(...body);
  $("actions").replaceChildren(
    ...actions.map(([label, onClick], i) => {
      const b = el("button", { type: "button", textContent: label, className: i === 0 ? "primary" : "" });
      b.addEventListener("click", async () => {
        for (const other of $("actions").querySelectorAll("button")) other.disabled = true;
        try {
          await onClick();
        } finally {
          for (const other of $("actions").querySelectorAll("button")) other.disabled = finished;
        }
      });
      return b;
    }),
  );
  $("actions").querySelector("button")?.focus();
}

async function close() {
  finished = true;
  await toBackground("done").catch(() => {});
  window.close();
}

async function convertAndCopy() {
  show({ status: t("copyWorking") });
  if (png) return writeClipboard();
  // Start the clipboard write now, while this window is focused, and hand it the image when it is ready.
  let failure = null;
  const ready = toBackground("copy").then((res) => {
    if (!res?.ok) {
      failure = res || { code: "unknown" };
      throw new Error(failure.code || "unknown");
    }
    png = dataUrlToBlob(res.dataUrl);
    return png;
  });
  await writeClipboard(ready, () => failure);
}

async function writeClipboard(source = png, conversionFailure = () => null) {
  try {
    await copyPng(source);
  } catch (e) {
    // The conversion itself failed (site access, network): that has its own explanation and is not a clipboard failure.
    const failed = conversionFailure();
    if (failed) return showFailure(failed);
    // Most often the window lost focus while converting. The clipboard was not changed.
    toBackground("count", { key: "fail_copy" }).catch(() => {});
    return show({
      title: t("copyFailed"),
      error: true,
      body: [el("p", { textContent: t("copyFailedNote") }), el("p", { className: "muted detail", textContent: e.message || "" })],
      actions: [
        [t("askRetry"), () => writeClipboard()],
        [t("copySavePng"), savePng],
        [t("askClose"), close],
      ],
    });
  }
  finished = true;
  show({ status: t("copyDone") });
  await toBackground("done").catch(() => {});
  await toBackground("copied").catch(() => {});
  // The one rating ask, if it's due: the window then stays open until it's answered or closed.
  const uses = await maybeReviewAsk();
  if (uses) {
    $("body").append(reviewAsk(() => setTimeout(() => window.close(), 1200), uses));
    // Make room for it.
    chrome.windows.getCurrent().then((w) => chrome.windows.update(w.id, { height: w.height + 160 })).catch(() => {});
    return;
  }
  setTimeout(() => window.close(), 1200);
}

async function savePng() {
  show({ status: t("askSaving") });
  const res = await toBackground("savePng");
  if (res?.ok) {
    finished = true;
    show({ status: res.path || res.filename ? t("askSavedAs", [res.path || res.filename]) : t("askSaved") });
    await toBackground("done").catch(() => {});
    setTimeout(() => window.close(), 1500);
  } else {
    // The ask window took over (site access, folder, or an error it explains).
    await close();
  }
}

function showFailure(res) {
  if (res.reason === "host") {
    return show({
      title: t("askHostTitle"),
      body: hostExplanation(res.host),
      actions: [
        [t("copyAllowAndCopy"), async () => {
          const granted = await chrome.permissions.request({ origins: [res.origin] });
          if (granted) toBackground("count", { key: "site_access_allowed" }).catch(() => {});
          if (!granted) {
            showFailure(res);
            $("status").textContent = t("askNotAllowed");
            $("status").className = "error";
            return;
          }
          await convertAndCopy();
        }],
        [t("askCancel"), close],
      ],
    });
  }
  const body = [el("p", { textContent: errorText(res.code) })];
  const extra = detailText(res);
  if (extra) body.push(el("p", { className: "muted detail", textContent: extra }));
  const actions = [];
  if (["http", "blocked", "timeout", "unknown"].includes(res.code)) actions.push([t("askRetry"), convertAndCopy]);
  if (isHttp(url)) actions.push([t("askOpenImage"), () => toBackground("openSource")]);
  actions.push([t("askClose"), close]);
  show({ title: t("copyFailed"), error: true, body, actions });
}

// Closing the window with the ✕ also clears the job.
addEventListener("pagehide", () => {
  if (!finished && jobId) toBackground("done");
});

async function init() {
  localisePage();
  const job = await toBackground("job").catch(() => null);
  if (!job?.ok) return show({ title: t("askNothingTitle"), body: [el("p", { textContent: errorText("expired") })], actions: [[t("askClose"), () => window.close()]] });
  url = job.url;
  await convertAndCopy();
}

init();
