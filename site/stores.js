// The right store for this browser. The pages are written for Chrome; in Firefox and Edge this points their
// install links to Firefox Add-ons or Edge Add-ons instead, in every language:
//   - a link to the Chrome Web Store goes to this browser's store, and "Chrome" in its text becomes
//     "Firefox" or "Edge" ("Add to Chrome — free" → "Add to Edge — free", "Get Imgkeep" just changes address);
//   - a link to this browser's store that names it ("Also for Firefox") becomes the Chrome one ("Also for Chrome").
// Left alone: links about a store itself (ratings, "Firefox Add-ons", "Microsoft Edge"), the download page's
// list of all three stores (.store), and the third browser's link. utm_campaign gets "-firefox" or "-edge",
// so the counts can tell these apart. It reads the browser's name in the page and sends or stores nothing.
(() => {
  const ua = navigator.userAgent;
  const name = /\bFirefox\//.test(ua) ? "Firefox" : /\bEdg\//.test(ua) ? "Edge" : null;
  if (!name) return;
  const STORE = {
    Chrome: "https://chromewebstore.google.com/detail/fkclfgbmjaafglfifenonfcahfdmajbl",
    Firefox: "https://addons.mozilla.org/firefox/addon/imgkeep/",
    Edge: "https://microsoftedge.microsoft.com/addons/detail/kokbmagcbobpjclpidebikeklmpafhhd",
  };
  const ABOUT_A_STORE = /Web Store|Add-ons|Google Chrome|Microsoft Edge|Mozilla/;
  const swap = (a, from, to) => {
    const query = new URLSearchParams(a.search);
    if (query.has("utm_campaign")) query.set("utm_campaign", `${query.get("utm_campaign")}-${name.toLowerCase()}`);
    a.href = STORE[to] + (query.size ? `?${query}` : "");
    // Only the browser's name changes, in the link's own text (not its icons or other markup).
    const walker = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
    for (let t; (t = walker.nextNode()); ) t.nodeValue = t.nodeValue.replaceAll(from, to);
  };
  const run = () => {
    for (const a of document.querySelectorAll("a[href]")) {
      if (a.closest(".store, .rating")) continue;
      const text = `${a.textContent} ${a.getAttribute("aria-label") || ""}`;
      if (ABOUT_A_STORE.test(text)) continue;
      if (a.href === STORE.Chrome || a.href.startsWith(`${STORE.Chrome}?`)) swap(a, "Chrome", name);
      else if (a.href.startsWith(STORE[name]) && text.includes(name)) swap(a, name, "Chrome");
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
