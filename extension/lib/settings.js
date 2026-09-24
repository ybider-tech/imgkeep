// Settings, output formats and file-name templating.
// Pure helpers (no chrome.* at import time) so tests can import this file in Node.

// Set to a waitlist URL to show "Get notified" on the Options page. Empty = hidden.
export const PRO_WAITLIST_URL = "";

export const DEFAULTS = {
  saveMode: "downloads", // "downloads" | "folder" | "ask"
  subfolder: "",
  filenameTemplate: "{name}",
  jpgQuality: 92,
  webpQuality: 90,
  jpgBackground: "#ffffff",
};

export const FORMATS = {
  png: { mime: "image/png", ext: "png", label: "PNG" },
  jpg: { mime: "image/jpeg", ext: "jpg", label: "JPG" },
  webp: { mime: "image/webp", ext: "webp", label: "WebP" },
};

// Extensions we trust when saving the original file as-is.
const IMAGE_EXTS = ["png", "jpg", "jpeg", "jfif", "gif", "webp", "avif", "svg", "bmp", "ico", "tif", "tiff", "apng", "heic"];
const MIME_EXTS = { "image/jpeg": "jpg", "image/svg+xml": "svg", "image/x-icon": "ico", "image/vnd.microsoft.icon": "ico" };

export async function getSettings() {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  return { ...DEFAULTS, ...stored };
}

export function clampQuality(value, fallback) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(100, Math.max(50, n)) : fallback;
}

function lastSegment(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:" && u.protocol !== "file:") return "";
    const seg = u.pathname.split("/").filter(Boolean).pop() || "";
    try { return decodeURIComponent(seg); } catch { return seg; }
  } catch {
    return "";
  }
}

// {name}: last path segment without its extension; "image" for data:/blob: URLs.
export function nameFromUrl(url) {
  const seg = lastSegment(url);
  const dot = seg.lastIndexOf(".");
  const base = dot > 0 ? seg.slice(0, dot) : seg;
  return base.trim() || "image";
}

// {host}: hostname without a leading "www."; empty for data:/blob: URLs.
export function hostFromUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol === "blob:") return hostFromUrl(u.pathname);
    return u.hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

// Extension for "Original format": from the URL path, or the MIME type of a data: URL.
export function extFromUrl(url) {
  const data = /^data:(image\/[a-z0-9.+-]+)/i.exec(url);
  if (data) {
    const mime = data[1].toLowerCase();
    return MIME_EXTS[mime] || mime.split("/")[1].replace(/\+.*$/, "");
  }
  const seg = lastSegment(url);
  const dot = seg.lastIndexOf(".");
  const ext = dot > 0 ? seg.slice(dot + 1).toLowerCase() : "";
  return IMAGE_EXTS.includes(ext) ? (ext === "jpeg" || ext === "jfif" ? "jpg" : ext) : "";
}

const pad = (n, len = 2) => String(n).padStart(len, "0");

export function tokensFor({ url, width, height, now = new Date() }) {
  return {
    name: nameFromUrl(url),
    host: hostFromUrl(url),
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`,
    w: width ? String(width) : "",
    h: height ? String(height) : "",
  };
}

export function fillTemplate(template, tokens) {
  let out = String(template ?? "");
  // Without known dimensions (Original format), drop "{w}x{h}" as a unit.
  if (!tokens.w || !tokens.h) out = out.replace(/\{w\}x\{h\}/g, "{w}");
  // Empty tokens become a marker, then take their leading separator with them ("photo-{host}" -> "photo").
  out = out.replace(/\{(name|host|date|time|w|h)\}/g, (_, key) => tokens[key] || "\u0000");
  return out.replace(/[-_ ]*\u0000/g, "").replace(/^[-_ ]+/, "");
}

const RESERVED = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;

// Make one path segment safe on Windows and macOS.
export function sanitizeSegment(text) {
  let s = String(text ?? "")
    .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s.]+|[\s.]+$/g, "");
  if (s.length > 120) s = s.slice(0, 120).replace(/[\s.]+$/g, "");
  if (RESERVED.test(s)) s += "_";
  return s;
}

// Returns { dirs: ["Imgkeep", "example.com"], name: "photo-320x200", ext: "png" }.
// `sample` overrides tokens (the Options preview uses it instead of a real URL).
export function buildTarget({ settings, url, width, height, ext, now, sample }) {
  const tokens = { ...tokensFor({ url, width, height, now }), ...sample };
  const dirs = String(settings.subfolder || "")
    .split("/")
    .map((part) => sanitizeSegment(fillTemplate(part, tokens)))
    .filter(Boolean);
  const name = sanitizeSegment(fillTemplate(settings.filenameTemplate || "{name}", tokens)) || sanitizeSegment(tokens.name) || "image";
  return { dirs, name, ext };
}

export function targetPath({ dirs, name, ext }) {
  return [...dirs, ext ? `${name}.${ext}` : name].join("/");
}
