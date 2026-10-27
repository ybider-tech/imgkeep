// Options page. Every change saves instantly to chrome.storage.sync.

import { DEFAULTS, PRO_WAITLIST_URL, getSettings, clampQuality, buildTarget, targetPath } from "./lib/settings.js";
import { cleanMaxWidth } from "./lib/image.js";
import { reviewUrl } from "./lib/review.js";
import { getFolder, setFolder, folderPermission } from "./lib/folder.js";
import { t, localisePage } from "./lib/i18n.js";
import { FOLDERS, IS_FIREFOX, COUNTS_CONSENT, countsAllowed } from "./lib/browser.js";

const $ = (id) => document.getElementById(id);
let savedTimer;

async function save(values) {
  await chrome.storage.sync.set(values);
  const badge = $("saved");
  badge.classList.add("show");
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => badge.classList.remove("show"), 1200);
}

// Live preview with a sample image.
const SAMPLE = { name: "summer-banner", host: "shop.example.com" };

function renderPreview() {
  const settings = { subfolder: $("subfolder").value, filenameTemplate: $("filenameTemplate").value };
  const target = buildTarget({ settings, url: "", width: 1600, height: 900, ext: "png", sample: SAMPLE });
  $("preview").textContent = targetPath(target);
}

async function renderFolder() {
  const handle = await getFolder().catch(() => null);
  const permission = await folderPermission(handle);
  const text = !handle
    ? t("optNoFolder")
    : t(permission === "granted" ? "optFolderConnected" : "optFolderReconnect", [handle.name]);
  $("folderStatus").textContent = text;
  $("chooseFolder").textContent = t(handle ? "optChangeFolder" : "optChooseFolder");
}

async function chooseFolder() {
  let handle;
  try {
    handle = await showDirectoryPicker({ mode: "readwrite", id: "imgkeep" });
  } catch {
    return; // picker closed
  }
  await setFolder(handle);
  // Picking a folder means you want to use it.
  document.querySelector('input[name="saveMode"][value="folder"]').checked = true;
  await save({ saveMode: "folder" });
  await renderFolder();
}

async function renderSites() {
  const { origins = [] } = await chrome.permissions.getAll();
  const list = $("sites");
  list.replaceChildren();
  for (const origin of origins.sort()) {
    const label = origin.replace(/\/\*$/, "");
    const remove = Object.assign(document.createElement("button"), { type: "button", textContent: t("optRemove") });
    remove.setAttribute("aria-label", t("optRemoveAccess", [label]));
    remove.addEventListener("click", async () => {
      await chrome.permissions.remove({ origins: [origin] });
      renderSites();
    });
    const name = Object.assign(document.createElement("span"), { className: "mono", textContent: label });
    const li = document.createElement("li");
    li.append(name, remove);
    list.append(li);
  }
  $("sitesEmpty").hidden = origins.length > 0;
}

function bindSlider(id) {
  const input = $(id);
  const out = $(`${id}Out`);
  const show = () => (out.textContent = input.value);
  input.addEventListener("input", show);
  input.addEventListener("change", () => save({ [id]: clampQuality(input.value, DEFAULTS[id]) }));
  show();
}

// The anonymous daily summary: today's counts so far, and the last summary that was sent, exactly as stored.
async function renderCounts() {
  const on = $("usageCounts").checked;
  const { counts, countsLastSent } = await chrome.storage.local.get(["counts", "countsLastSent"]);
  const show = (value) => (value && Object.keys(value).length ? JSON.stringify(value, null, 2) : t("optCountsNone"));
  $("countsToday").textContent = on ? show(counts?.c) : t("optCountsOff");
  $("countsLast").textContent = countsLastSent ? `${countsLastSent.day}\n${show(countsLastSent.props)}` : t("optCountsNone");
}

// Find image here: on only while the browser has granted its two optional permissions.
const FIND_PERMISSIONS = { permissions: ["activeTab", "scripting"] };

async function renderFind() {
  $("imageFinder").checked = await chrome.permissions.contains(FIND_PERMISSIONS);
}

async function init() {
  localisePage();
  const s = await getSettings();
  // Firefox can't write into a chosen folder (lib/browser.js): Downloads or ask every time.
  if (!FOLDERS) {
    document.querySelector('input[name="saveMode"][value="folder"]').closest("label").hidden = true;
    $("chooseFolder").closest(".row").hidden = true;
    if (s.saveMode === "folder") s.saveMode = "downloads";
  }

  for (const radio of document.querySelectorAll('input[name="saveMode"]')) {
    radio.checked = radio.value === s.saveMode;
    radio.addEventListener("change", () => radio.checked && save({ saveMode: radio.value }));
  }

  for (const id of ["subfolder", "filenameTemplate"]) {
    const input = $(id);
    input.value = s[id];
    input.addEventListener("input", () => {
      renderPreview();
      save({ [id]: id === "filenameTemplate" ? input.value || DEFAULTS.filenameTemplate : input.value });
    });
  }

  $("jpgQuality").value = s.jpgQuality;
  $("webpQuality").value = s.webpQuality;
  bindSlider("jpgQuality");
  bindSlider("webpQuality");

  $("jpgBackground").value = s.jpgBackground;
  $("jpgBackground").addEventListener("change", (e) => save({ jpgBackground: e.target.value }));

  $("maxWidth").value = s.maxWidth > 0 ? s.maxWidth : "";
  $("maxWidth").addEventListener("change", (e) => {
    const maxWidth = cleanMaxWidth(e.target.value);
    e.target.value = maxWidth || "";
    save({ maxWidth });
  });

  $("usageCounts").checked = s.usageCounts !== false && (await countsAllowed());
  $("usageCounts").addEventListener("change", async (e) => {
    // Firefox keeps its own switch for this ("technical and interaction data"), asked at install:
    // turning the summary on here asks Firefox too, and turning it off withdraws that permission.
    if (IS_FIREFOX) {
      const ok = e.target.checked
        ? await chrome.permissions.request(COUNTS_CONSENT).catch(() => false)
        : await chrome.permissions.remove(COUNTS_CONSENT).catch(() => true);
      if (e.target.checked && !ok) e.target.checked = false;
    }
    await save({ usageCounts: e.target.checked });
    renderCounts();
  });
  $("countsDetails").addEventListener("toggle", renderCounts);

  $("imageFinder").addEventListener("change", async (e) => {
    // Turning on needs this click: the browser grants optional permissions only from a user action.
    const ok = e.target.checked
      ? await chrome.permissions.request(FIND_PERMISSIONS).catch(() => false)
      : await chrome.permissions.remove(FIND_PERMISSIONS).catch(() => false);
    $("imageFinderStatus").textContent = ok ? t(e.target.checked ? "optFindOn" : "optFindOff") : "";
    await renderFind();
  });

  $("chooseFolder").addEventListener("click", chooseFolder);

  if (PRO_WAITLIST_URL) {
    $("waitlistLink").href = PRO_WAITLIST_URL;
    $("waitlist").hidden = false;
  }
  $("version").textContent = chrome.runtime.getManifest().version;
  $("rateLink").href = reviewUrl(navigator.userAgent); // the Chrome or Edge store, whichever this is

  chrome.permissions.onAdded.addListener(renderSites);
  chrome.permissions.onRemoved.addListener(renderSites);
  addEventListener("focus", renderFolder);

  renderPreview();
  await Promise.all([renderFolder(), renderSites(), renderFind()]);
}

init();
