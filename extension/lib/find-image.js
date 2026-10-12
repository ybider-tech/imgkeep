// PROTOTYPE. Finds the image under the right-click on sites that cover their images with another
// layer (Instagram, Pinterest…), where the browser's own "image" right-click never fires.
//
// findImageInPage runs inside the page, once, right after the user clicks "Find image here"
// (chrome.scripting.executeScript with activeTab). It must be self-contained: no imports, no outer variables.
// It reads only the page's image elements and returns their addresses; nothing else leaves the page.

export function findImageInPage() {
  const MIN = 80; // ignore icons, avatars and tracking pixels (CSS pixels, either side)

  // The best address for an <img>: the widest srcset entry, else what the browser loaded.
  const bestSrc = (img) => {
    let best = img.currentSrc || img.src || "";
    let bestW = 0;
    for (const part of (img.srcset || "").split(",")) {
      const [url, size] = part.trim().split(/\s+/);
      const w = parseFloat(size) || 0;
      if (url && w > bestW) [best, bestW] = [new URL(url, location.href).href, w];
    }
    return best;
  };

  const bgUrl = (el) => {
    const m = /url\(["']?(.*?)["']?\)/.exec(getComputedStyle(el).backgroundImage || "");
    return m && !m[1].startsWith("data:image/svg") ? new URL(m[1], location.href).href : "";
  };

  const visible = (r) =>
    r.width >= MIN && r.height >= MIN && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;

  // Every image-like thing on screen: <img>, <video poster>, and elements with a background image.
  const candidates = [];
  for (const img of document.images) {
    const r = img.getBoundingClientRect();
    const url = bestSrc(img);
    if (url && visible(r)) candidates.push({ url, rect: r, kind: "img", el: img });
  }
  for (const v of document.querySelectorAll("video[poster]")) {
    const r = v.getBoundingClientRect();
    if (visible(r)) candidates.push({ url: new URL(v.poster, location.href).href, rect: r, kind: "poster", el: v });
  }
  for (const el of document.querySelectorAll("div, a, span, figure, section")) {
    const url = bgUrl(el);
    if (!url) continue;
    const r = el.getBoundingClientRect();
    if (visible(r)) candidates.push({ url, rect: r, kind: "background", el });
  }

  // Where was the right-click? The browser keeps :hover on the element under the pointer while its own
  // menu is open, so the deepest hovered element marks the spot.
  // The whole page (html, body), or a layer covering most of the screen (a sign-in wall, a lightbox
  // backdrop), doesn't tell us the spot: then the picker takes over.
  const last = [...document.querySelectorAll(":hover")].pop();
  const lr = last?.getBoundingClientRect();
  const tooBig = lr && lr.width * lr.height > 0.6 * innerWidth * innerHeight;
  const hovered = last && last !== document.documentElement && last !== document.body && !tooBig ? last : null;

  const area = (r) => r.width * r.height;
  const overlap = (a, b) => {
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return w > 0 && h > 0 ? w * h : 0;
  };
  // The image that best matches the layer under the pointer: covers layers usually sit exactly on their
  // image, so the share of shared area (intersection over union) is highest for the right one.
  let under = [];
  if (hovered) {
    const hr = hovered.getBoundingClientRect();
    under = candidates
      .map((c) => {
        const inter = overlap(c.rect, hr);
        return { c, score: inter / (area(c.rect) + area(hr) - inter) };
      })
      .filter((x) => x.score > 0.3)
      .sort((x, y) => y.score - x.score)
      .map((x) => x.c);
  }

  const unique = (list) => [...new Map(list.map((c) => [c.url, c])).values()];
  const out = (c) => ({ url: c.url, kind: c.kind, width: Math.round(c.rect.width), height: Math.round(c.rect.height) });
  return {
    hoveredTag: hovered ? hovered.tagName.toLowerCase() : null,
    found: under.length ? out(under[0]) : null,
    // For a picker when nothing (or several things) sit under the click: biggest first.
    onScreen: unique(candidates).sort((a, b) => area(b.rect) - area(a.rect)).slice(0, 12).map(out),
  };
}
