// The small decision window: site access, folder reconnect, or a plain error.

import { getFolder, setFolder, writeUnique, dataUrlToBlob } from "./lib/folder.js";
import { FORMATS } from "./lib/settings.js";

const jobId = new URLSearchParams(location.search).get("job");
const key = `job:${jobId}`;
const $ = (id) => document.getElementById(id);
const toBackground = (type) => chrome.runtime.sendMessage({ target: "background", type, jobId });

let job = null;
let folder = null; // loaded up front so the click can go straight to requestPermission
let finished = false;

const ERRORS = {
  blocked: "The site didn't hand over this image, even with access allowed. The server may be down, or it only serves the image inside its own pages.",
  http: "The site answered with an error instead of the image.",
  decode: "Chrome couldn't read this file as an image.",
  unsupported: "This version of Chrome can't create this format. Try PNG instead.",
  blob: "This image only exists inside the page (a blob: link). Imgkeep can't read it because it has no access to your pages.",
  "too-large": "This image is too large to convert in the browser.",
  download: "Chrome couldn't start the download.",
  write: "Imgkeep couldn't write the file to your folder.",
  expired: "This save has expired. Right-click the image and try again.",
  unknown: "Something went wrong while saving this image.",
};

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

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

function isHttp(url) {
  return /^https?:/i.test(url || "");
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
  return where ? `Saved as ${where}` : "Saved.";
}

// Handle the answer of a retry: done, or a new decision to show.
async function afterRetry(result) {
  if (result.ok) return finish(savedMessage(result));
  const stored = await chrome.storage.session.get(key);
  job = stored[key] || { ...job, ...result };
  render();
}

async function saveOriginal() {
  status("Saving…");
  await afterRetry(await toBackground("original"));
}

function render() {
  const body = $("body");
  const actions = $("actions");
  body.replaceChildren();
  actions.replaceChildren();
  status("");

  if (!job) {
    $("title").textContent = "Nothing to save";
    body.append(el("p", { textContent: ERRORS.expired }));
    actions.append(button("Close", () => window.close(), true));
    return;
  }

  const reason = job.reason;
  const cancelBtn = button("Cancel", cancel);

  if (reason === "host") {
    $("title").textContent = "Allow images from this site?";
    body.append(
      el("p", {}, el("strong", { textContent: job.host }), " blocks other sites from reading its images, so Imgkeep can't convert this one yet."),
      el("p", { className: "muted", textContent: "Access is for this one site only, to fetch images you pick. You can remove it any time in Options." }),
    );
    actions.append(
      button("Allow and save", async () => {
        const granted = await chrome.permissions.request({ origins: [job.origin] });
        if (!granted) return status("Access wasn't allowed. Nothing was saved.", true);
        status("Saving…");
        await afterRetry(await toBackground("retry"));
      }, true),
      button("Save original format instead", saveOriginal),
      cancelBtn,
    );
    return;
  }

  if (reason === "folder-permission" || reason === "no-folder") {
    const reconnect = reason === "folder-permission" && folder;
    $("title").textContent = reconnect ? `Reconnect “${folder.name}”` : "Choose a folder";
    body.append(
      el("p", {
        textContent: reconnect
          ? "Chrome needs your OK to save into this folder again."
          : "Pick the folder where Imgkeep should save your images.",
      }),
      el("p", { className: "muted" }, "When Chrome asks, choose ", el("strong", { textContent: "“Allow on every visit”" }), " so it won't ask again."),
    );
    actions.append(button(reconnect ? "Reconnect and save" : "Choose folder and save", () => writeToFolder(reconnect), true), cancelBtn);
    return;
  }

  // Plain error.
  $("title").textContent = "Couldn't save this image";
  body.append(el("p", { textContent: ERRORS[job.code] || ERRORS.unknown }));
  const extra = job.code === "http" && job.detail ? `HTTP ${job.detail}` : job.detail;
  if (extra) body.append(el("p", { className: "muted detail", textContent: extra }));
  if (isHttp(job.url) && job.format !== "original") actions.append(button("Save original format instead", saveOriginal, true));
  actions.append(button("Close", cancel, !isHttp(job.url) || job.format === "original"));
}

async function writeToFolder(reconnect) {
  // Both calls below need this click, so they come first.
  if (reconnect) {
    const permission = await folder.requestPermission({ mode: "readwrite" });
    if (permission !== "granted") return status("Chrome didn't allow access to the folder. Nothing was saved.", true);
  } else {
    try {
      folder = await showDirectoryPicker({ mode: "readwrite", id: "imgkeep" });
    } catch {
      return status("No folder chosen. Nothing was saved.", true);
    }
    await setFolder(folder);
  }
  status("Saving…");
  const res = await toBackground("blobFor");
  if (!res?.ok) {
    job = { ...job, reason: "error", code: res?.code || "unknown", detail: res?.detail || "" };
    return render();
  }
  const { dirs, name } = res.target;
  const ext = res.target.ext || FORMATS[job.format]?.ext;
  try {
    const path = await writeUnique(folder, dirs, name, ext, dataUrlToBlob(res.dataUrl));
    await finish(`Saved to ${folder.name}/${path}`);
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
  render();
}

init();
