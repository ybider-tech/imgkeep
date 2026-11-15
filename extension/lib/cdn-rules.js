// "Original size" (Options, off by default): many sites show a smaller copy of an image, made by their image
// service from the full-size file. For the services below, the full-size file's address can be worked out from
// the address of the copy, so Imgkeep can ask the same site for that file instead.
//
// Pure: no chrome.* and no network. originalUrl() only rewrites an address; offscreen.js fetches it, checks that
// it really is an image, and falls back to the image that was clicked if anything goes wrong. One rule per
// service, each a function of the URL, so adding a service is one entry and one test.

const RASTER = /\.(jpe?g|png|gif|webp)$/i;

// Each rule: { name, hosts: RegExp on the hostname (or test(u)), original(u: URL) → URL | null }.
export const CDN_RULES = [
  {
    // pbs.twimg.com/media/ID?format=jpg&name=small → name=orig. Older ".jpg:large" form too.
    // Profile pictures: …/ID_normal.jpg (and _bigger, _mini, _200x200, _400x400) → …/ID.jpg.
    name: "twitter",
    test: (u) => u.hostname === "pbs.twimg.com",
    original(u) {
      if (u.pathname.startsWith("/media/")) {
        const legacy = /^(\/media\/[^/:]+)\.(jpe?g|png|webp):[a-z]+$/i.exec(u.pathname);
        if (legacy) {
          u.pathname = legacy[1];
          u.search = "";
          u.searchParams.set("format", legacy[2].toLowerCase() === "jpeg" ? "jpg" : legacy[2].toLowerCase());
        } else if (/\.(jpe?g|png|webp)$/i.test(u.pathname) && !u.searchParams.has("format")) {
          const [, path, ext] = /^(.*)\.([a-z]+)$/i.exec(u.pathname);
          u.pathname = path;
          u.searchParams.set("format", ext.toLowerCase() === "jpeg" ? "jpg" : ext.toLowerCase());
        }
        if (!u.searchParams.has("format")) return null;
        u.searchParams.set("name", "orig");
        return u;
      }
      if (u.pathname.startsWith("/profile_images/")) {
        const p = u.pathname.replace(/_(normal|bigger|mini|\d+x\d+)(\.[a-z]+)$/i, "$2");
        if (p === u.pathname) return null;
        u.pathname = p;
        return u;
      }
      return null;
    },
  },
  {
    // i.pinimg.com/236x/ab/cd/ef/HASH.jpg (also 474x, 736x, 75x75_RS…) → i.pinimg.com/originals/ab/cd/ef/HASH.jpg
    name: "pinterest",
    test: (u) => u.hostname === "i.pinimg.com",
    original(u) {
      const p = u.pathname.replace(/^\/\d+x\d*(_[a-z]+)?\//i, "/originals/");
      if (p === u.pathname) return null;
      u.pathname = p;
      return u;
    },
  },
  {
    // Shopify: cdn.shopify.com/…/files/NAME_400x.jpg?v=1 or a shop's own /cdn/shop/files/NAME.jpg?v=1&width=400
    // → NAME.jpg?v=1 (the size suffix or the width/height/crop settings removed).
    name: "shopify",
    test: (u) => u.hostname === "cdn.shopify.com" || u.pathname.startsWith("/cdn/shop/"),
    original(u) {
      const before = u.href;
      u.pathname = u.pathname.replace(/_(\d+x\d*|x\d+|pico|icon|thumb|small|compact|medium|large|grande)(_crop_[a-z]+)?(@\dx)?(\.[a-z]+)$/i, "$4");
      for (const k of ["width", "height", "crop", "pad_color"]) u.searchParams.delete(k);
      return u.href === before ? null : u;
    },
  },
  {
    // WordPress: /wp-content/uploads/2024/05/photo-300x200.jpg → photo.jpg.
    // Jetpack's image service (i0.wp.com … i3.wp.com): the size settings in the query removed.
    name: "wordpress",
    test: (u) => u.pathname.includes("/wp-content/uploads/") || /^i[0-3]\.wp\.com$/.test(u.hostname),
    original(u) {
      const before = u.href;
      if (u.pathname.includes("/wp-content/uploads/")) u.pathname = u.pathname.replace(/-\d+x\d+(\.(jpe?g|png|gif|webp))$/i, "$1");
      if (/^i[0-3]\.wp\.com$/.test(u.hostname)) for (const k of ["w", "h", "resize", "fit", "crop", "zoom", "quality"]) u.searchParams.delete(k);
      return u.href === before ? null : u;
    },
  },
  {
    // i.etsystatic.com/…/il_340x270.1234_abcd.jpg (also il_794xN, il_75x75) → il_fullxfull.1234_abcd.jpg
    name: "etsy",
    test: (u) => u.hostname === "i.etsystatic.com",
    original(u) {
      const p = u.pathname.replace(/\/il_(\d+x\d+|\d+xN)\./, "/il_fullxfull.");
      if (p === u.pathname) return null;
      u.pathname = p;
      return u;
    },
  },
  {
    // preview.redd.it/ID.jpg?width=640&crop=smart&auto=webp&s=… → i.redd.it/ID.jpg (Reddit's full-size file).
    name: "reddit",
    test: (u) => u.hostname === "preview.redd.it",
    original(u) {
      if (!/^\/[^/]+\.(jpe?g|png|gif)$/i.test(u.pathname)) return null;
      u.hostname = "i.redd.it";
      u.search = "";
      return u;
    },
  },
  {
    // Unsplash and other imgix sites: images.unsplash.com/photo-…?w=400&q=80&fm=jpg → the same without the
    // size, quality and format settings (imgix then sends the uploaded file).
    name: "imgix",
    test: (u) => u.hostname === "images.unsplash.com" || u.hostname.endsWith(".imgix.net"),
    original(u) {
      const before = u.href;
      for (const k of ["w", "h", "max-w", "max-h", "fit", "crop", "dpr", "q", "auto", "fm", "rect"]) u.searchParams.delete(k);
      return u.href === before ? null : u;
    },
  },
  {
    // Wikipedia and Wikimedia Commons thumbnails: upload.wikimedia.org/wikipedia/commons/thumb/a/ab/File.jpg/220px-File.jpg
    // → upload.wikimedia.org/wikipedia/commons/a/ab/File.jpg. Only for photos and pictures (not SVG, PDF or TIFF files).
    name: "wikimedia",
    test: (u) => u.hostname === "upload.wikimedia.org",
    original(u) {
      const m = /^(\/[^/]+\/[^/]+)\/thumb(\/[0-9a-f]\/[0-9a-f]{2}\/[^/]+)\/[^/]+$/.exec(u.pathname);
      if (!m || !RASTER.test(m[2])) return null;
      u.pathname = m[1] + m[2];
      return u;
    },
  },
];

// The full-size file's address for an image address, or null when no rule applies (or it's already the original).
export function originalUrl(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  for (const rule of CDN_RULES) {
    if (!rule.test(u)) continue;
    const out = rule.original(new URL(u.href));
    return out && out.href !== u.href ? out.href : null;
  }
  return null;
}
