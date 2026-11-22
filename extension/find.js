// The "Find image here" window: turn the feature on, pick one of the images found on screen,
// or explain that nothing was found. Also for Alt+S and the toolbar button (via "shortcut" or "toolbar"),
// which use the same permissions.

import { t, localisePage } from "./lib/i18n.js";
import { ask, el } from "./lib/ui.js";

const jobId = new URLSearchParams(location.search).get("job");
const $ = (id) => document.getElementById(id);
const toBackground = (type, extra) => ask(jobId, type, extra);
const FIND_PERMISSIONS = { permissions: ["activeTab", "scripting"] };
let finished = false;

function show({ title, body = [], actions = [], status = "", error = false }) {
  $("title").textContent = title;
  $("body").replaceChildren(...body.map((text) => el("p", { textContent: text })));
  $("actions").replaceChildren(
    ...actions.map(([label, onClick], i) => {
      const b = el("button", { type: "button", textContent: label, className: i === 0 ? "primary" : "" });
      b.addEventListener("click", onClick);
      return b;
    }),
  );
  $("status").textContent = status;
  $("status").className = error ? "error" : "";
  $("actions").querySelector("button")?.focus();
}

async function close() {
  finished = true;
  await toBackground("done").catch(() => {});
  window.close();
}

let fromShortcut = false; // opened by Alt+S or the toolbar button, not the right-click menu

// The shortcut as the browser shows it ("Alt+S", "⌥S"), or Alt+S if none is set.
async function shortcutKey() {
  const commands = await chrome.commands?.getAll?.().catch(() => []);
  return commands?.find((c) => c.name === "save-image")?.shortcut || "Alt+S";
}

async function enable() {
  const key = await shortcutKey();
  show({
    title: t(fromShortcut ? "findShortcutTitle" : "findEnableTitle"),
    body: fromShortcut ? [t("findShortcutBody", [key]), t("findPromise")] : [t("findEnableBody"), t("findPromise")],
    actions: [
      [t("findTurnOn"), async () => {
        // The browser needs this click to grant it. Neither permission comes with a warning.
        const granted = await chrome.permissions.request(FIND_PERMISSIONS).catch(() => false);
        await toBackground("finderTurnedOn").catch(() => {});
        if (!granted) return show({ title: t("findEnableTitle"), body: [t("findDenied")], actions: [[t("askClose"), close]] });
        show({ title: t("findOnTitle"), body: [fromShortcut ? t("findShortcutOn", [key]) : t("findOnBody")], actions: [[t("askClose"), close]] });
      }],
      [t("askCancel"), close],
    ],
  });
}

function pick(candidates) {
  show({ title: t("findPickTitle"), body: [t("findPickBody")], actions: [[t("askCancel"), close]] });
  $("actions").querySelector("button").className = ""; // picking an image is the main action here
  $("grid").hidden = false;
  $("grid").replaceChildren(
    ...candidates.map((c, index) => {
      const img = el("img", { src: c.url, alt: "", referrerPolicy: "no-referrer", loading: "lazy" });
      const b = el("button", { type: "button", title: `${c.width} × ${c.height}` }, img);
      b.setAttribute("aria-label", t("findPickOne", [String(index + 1)]));
      b.addEventListener("click", async () => {
        const res = await toBackground("pickImage", { index });
        if (res?.ok) close();
      });
      return b;
    }),
  );
  $("grid").querySelector("button")?.focus();
}

addEventListener("pagehide", () => {
  if (!finished && jobId) toBackground("done");
});

async function init() {
  localisePage();
  const job = await toBackground("finderJob").catch(() => null);
  if (!job?.ok) return show({ title: t("askNothingTitle"), body: [t("askErrExpired")], actions: [[t("askClose"), () => window.close()]] });
  fromShortcut = job.via === "shortcut" || job.via === "toolbar";
  if (job.mode === "enable") return enable();
  if (job.mode === "pick") return pick(job.candidates);
  if (job.mode === "error") return show({ title: t("findErrorTitle"), body: [t(fromShortcut ? "findShortcutError" : "findErrorBody")], actions: [[t("askClose"), close]] });
  const body = fromShortcut ? t("findShortcutNothing", [await shortcutKey()]) : t("findNothingBody");
  show({ title: t("findNothingTitle"), body: [body], actions: [[t("askClose"), close]] });
}

init();
