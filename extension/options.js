// Options page. Every change saves instantly to chrome.storage.sync.

import { DEFAULTS, PRO_WAITLIST_URL, getSettings, clampQuality, buildTarget, targetPath } from "./lib/settings.js";
import { getFolder, setFolder, folderPermission } from "./lib/folder.js";

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
    ? "No folder chosen yet."
    : `“${handle.name}” — ${permission === "granted" ? "connected" : "will ask to reconnect"}`;
  $("folderStatus").textContent = text;
  $("chooseFolder").textContent = handle ? "Change folder…" : "Choose folder…";
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
    const remove = Object.assign(document.createElement("button"), { type: "button", textContent: "Remove" });
    remove.setAttribute("aria-label", `Remove access to ${label}`);
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

async function init() {
  const s = await getSettings();

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

  $("chooseFolder").addEventListener("click", chooseFolder);

  if (PRO_WAITLIST_URL) {
    $("waitlistLink").href = PRO_WAITLIST_URL;
    $("waitlist").hidden = false;
  }
  $("version").textContent = chrome.runtime.getManifest().version;

  chrome.permissions.onAdded.addListener(renderSites);
  chrome.permissions.onRemoved.addListener(renderSites);
  addEventListener("focus", renderFolder);

  renderPreview();
  await Promise.all([renderFolder(), renderSites()]);
}

init();
