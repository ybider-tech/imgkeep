// The small decision window: site access, folder reconnect, or a plain error.

import { getFolder, setFolder, writeUnique, dataUrlToBlob } from "./lib/folder.js";
import { FORMATS } from "./lib/settings.js";
import { t, localisePage, richText } from "./lib/i18n.js";
import { errorText, detailText, el, isHttp } from "./lib/ui.js";

const jobId = new URLSearchParams(location.search).get("job");
const key = `job:${jobId}`;
const $ = (id) => document.getElementById(id);
const toBackground = (type) => chrome.runtime.sendMessage({ target: "background", type, jobId });

let job = null;
let folder = null; // loaded up front so the click can go straight to requestPermission
let finished = false;

function button(label, onClick, primary = false) {
  const b = el("button", { type: "button", textContent: label, className: primary ? "primary" : "" });
  b.addEventListener("click", async () => {
    setBusy(true);
    try {
      await onClick();
    } catch (e) {
      status(e.message || String(e), true);
    } finally {
      if (!finished) setBusy(false);
    }
  });
  return b;
}

function setBusy(busy) {
  for (const b of document.querySelectorAll("#actions button")) b.disabled = busy;
}

function status(text, isError = false) {
  $("status").textContent = text;
  $("status").className = isError ? "error" : "";
}

async function finish(message) {
  finished = true;
  setBusy(true);
  status(message);
  await toBackground("done");
  setTimeout(() => window.close(), 1000);
}

async function cancel() {
  finished = true;
  await toBackground("done");
  window.close();
}

function savedMessage(result) {
  const where = result.path || result.filename;
  return where ? t("askSavedAs", [where]) : t("askSaved");
}

// Handle the answer of a retry: done, or a new decision to show.
async function afterRetry(result) {
  if (result.ok) return finish(savedMessage(result));
  const stored = await chrome.storage.session.get(key);
  job = stored[key] || { ...job, ...result };
  render();
}

async function saveOriginal() {
  status(t("askSaving"));
  await afterRetry(await toBackground("original"));
}

function render() {
  const body = $("body");
  const actions = $("actions");
  body.replaceChildren();
  actions.replaceChildren();
  status("");

  if (!job) {
    $("title").textContent = t("askNothingTitle");
    body.append(el("p", { textContent: errorText("expired") }));
    actions.append(button(t("askClose"), () => window.close(), true));
    return;
  }

  const reason = job.reason;
  const cancelBtn = button(t("askCancel"), cancel);

  if (reason === "host") {
    $("title").textContent = t("askHostTitle");
    body.append(
      el("p", {}, ...richText("askHostBody", job.host)),
      el("p", { className: "muted", textContent: t("askHostNote") }),
    );
    actions.append(
      button(t("askAllowAndSave"), async () => {
        const granted = await chrome.permissions.request({ origins: [job.origin] });
        if (!granted) return status(t("askNotAllowed"), true);
        status(t("askSaving"));
        await afterRetry(await toBackground("retry"));
      }, true),
      button(t("askSaveOriginal"), saveOriginal),
      cancelBtn,
    );
    return;
  }

  if (reason === "folder-permission" || reason === "no-folder") {
    const reconnect = reason === "folder-permission" && folder;
    $("title").textContent = reconnect ? t("askReconnectTitle", [folder.name]) : t("askChooseTitle");
    body.append(
      el("p", { textContent: reconnect ? t("askReconnectBody") : t("askChooseBody") }),
      el("p", { className: "muted" }, ...richText("askEveryVisit", t("askEveryVisitOption"))),
    );
    actions.append(button(reconnect ? t("askReconnectButton") : t("askChooseButton"), () => writeToFolder(reconnect), true), cancelBtn);
    return;
  }

  // Plain error.
  $("title").textContent = t("askErrorTitle");
  body.append(el("p", { textContent: errorText(job.code) }));
  const extra = detailText(job);
  if (extra) body.append(el("p", { className: "muted detail", textContent: extra }));
  // The first button is the main one.
  const add = (label, onClick) => actions.append(button(label, onClick, !actions.children.length));
  // Worth another go: the network, a server error, a slow converter. Not: a file that isn't an image.
  if (["http", "blocked", "timeout", "download", "write", "unknown"].includes(job.code) && job.format) {
    add(t("askRetry"), async () => {
      status(t("askSaving"));
      await afterRetry(await toBackground("retry"));
    });
  }
  if (isHttp(job.url) && job.format !== "original") add(t("askSaveOriginal"), saveOriginal);
  if (isHttp(job.url)) add(t("askOpenImage"), () => toBackground("openSource"));
  add(t("askClose"), cancel);
}

async function writeToFolder(reconnect) {
  // Both calls below need this click, so they come first.
  if (reconnect) {
    const permission = await folder.requestPermission({ mode: "readwrite" });
    if (permission !== "granted") return status(t("askFolderDenied"), true);
  } else {
    try {
      folder = await showDirectoryPicker({ mode: "readwrite", id: "imgkeep" });
    } catch {
      return status(t("askNoFolder"), true);
    }
    await setFolder(folder);
  }
  status(t("askSaving"));
  const res = await toBackground("blobFor");
  if (!res?.ok) {
    job = { ...job, reason: "error", code: res?.code || "unknown", detail: res?.detail || "", detailSubs: res?.subs };
    return render();
  }
  const { dirs, name } = res.target;
  const ext = res.target.ext || FORMATS[job.format]?.ext;
  try {
    const path = await writeUnique(folder, dirs, name, ext, dataUrlToBlob(res.dataUrl));
    await finish(t("askSavedTo", [`${folder.name}/${path}`]));
  } catch (e) {
    job = { ...job, reason: "error", code: "write", detail: e.message };
    render();
  }
}

// Closing the window with the ✕ also clears the pending job.
addEventListener("pagehide", () => {
  if (!finished && jobId) chrome.runtime.sendMessage({ target: "background", type: "done", jobId });
});

async function init() {
  const stored = jobId ? await chrome.storage.session.get(key) : {};
  job = stored[key] || null;
  folder = await getFolder().catch(() => null);
  document.title = "Imgkeep";
  localisePage();
  render();
}

init();
