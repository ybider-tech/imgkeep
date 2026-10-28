// Colour palettes: an image's main colours, and the files and code they can be copied or saved as.
// Pure functions (no chrome.*, no DOM, no network) so tests can import this file in Node. The offscreen
// document hands in the image's pixels, already made small (at most PALETTE_SAMPLE px on the longer side).
//
// How the colours are found: similar pixels are grouped first (32 levels per channel, keeping each group's
// exact average), then k-means in Lab colour space (k-means++ seeding with a fixed seed, so the same image
// always gives the same palette). Clusters that look alike (ΔE < MERGE_DE) count as one, and the next
// largest fills the gap. Each colour is the exact average of its pixels; its share is the part of the
// image closest to it. Transparent pixels (alpha < 128) are ignored.

export const PALETTE_COUNTS = [5, 8, 12];
export const PALETTE_SAMPLE = 200; // longest side, in pixels, before sampling
const MERGE_DE = 8;
const MAX_ITERATIONS = 20;

// ---- Colour spaces ----

const toLinear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const LINEAR = Array.from({ length: 256 }, (_, i) => toLinear(i));

// sRGB (0–255) → CIE Lab (D65).
export function rgbToLab([r, g, b]) {
  const R = LINEAR[Math.round(r)] ?? toLinear(r);
  const G = LINEAR[Math.round(g)] ?? toLinear(g);
  const B = LINEAR[Math.round(b)] ?? toLinear(b);
  const x = (0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / 0.95047;
  const y = 0.2126729 * R + 0.7151522 * G + 0.072175 * B;
  const z = (0.0193339 * R + 0.119192 * G + 0.9503041 * B) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

// ---- Extraction ----

// The same random numbers every time (mulberry32), so a palette never changes between runs.
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pixels → groups of near-identical colours: { rgb (exact average), lab, weight }.
function groupPixels(data) {
  const bins = new Map();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const bin = bins.get(key);
    if (bin) {
      bin.r += r;
      bin.g += g;
      bin.b += b;
      bin.n++;
    } else bins.set(key, { r, g, b, n: 1 });
  }
  return [...bins.entries()]
    .sort((a, b) => a[0] - b[0]) // a fixed order, so seeding is repeatable
    .map(([, { r, g, b, n }]) => {
      const rgb = [r / n, g / n, b / n];
      return { rgb, lab: rgbToLab(rgb), weight: n, sum: [r, g, b] };
    });
}

// Weighted k-means++ seeding. Stops early when every point already sits on a centre (few colours).
function seedCentres(points, k, random) {
  const total = points.reduce((s, p) => s + p.weight, 0);
  let pick = random() * total;
  let first = points[0];
  for (const p of points) if ((pick -= p.weight) <= 0) { first = p; break; }
  const centres = [first.lab];
  const d = points.map((p) => dist2(p.lab, first.lab));
  while (centres.length < k) {
    let sum = 0;
    for (let i = 0; i < points.length; i++) sum += d[i] * points[i].weight;
    if (sum <= 1e-9) break;
    let r = random() * sum;
    let chosen = points.length - 1;
    for (let i = 0; i < points.length; i++) if ((r -= d[i] * points[i].weight) <= 0) { chosen = i; break; }
    const c = points[chosen].lab;
    centres.push(c);
    for (let i = 0; i < points.length; i++) d[i] = Math.min(d[i], dist2(points[i].lab, c));
  }
  return centres;
}

function nearest(lab, centres) {
  let best = 0;
  let bestD = Infinity;
  for (let j = 0; j < centres.length; j++) {
    const dd = dist2(lab, centres[j]);
    if (dd < bestD) {
      bestD = dd;
      best = j;
    }
  }
  return best;
}

function kmeans(points, k, random) {
  let centres = seedCentres(points, k, random);
  let assign = new Int32Array(points.length).fill(-1);
  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    let moved = false;
    for (let i = 0; i < points.length; i++) {
      const j = nearest(points[i].lab, centres);
      if (assign[i] !== j) {
        assign[i] = j;
        moved = true;
      }
    }
    if (!moved) break;
    const acc = centres.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < points.length; i++) {
      const a = acc[assign[i]];
      const w = points[i].weight;
      a[0] += points[i].lab[0] * w;
      a[1] += points[i].lab[1] * w;
      a[2] += points[i].lab[2] * w;
      a[3] += w;
    }
    centres = centres.map((c, j) => (acc[j][3] ? [acc[j][0] / acc[j][3], acc[j][1] / acc[j][3], acc[j][2] / acc[j][3]] : c));
  }
  // Each cluster: the exact average colour of its pixels, and how many there are.
  const clusters = centres.map(() => ({ sum: [0, 0, 0], weight: 0 }));
  for (let i = 0; i < points.length; i++) {
    const c = clusters[assign[i]];
    c.sum[0] += points[i].sum[0];
    c.sum[1] += points[i].sum[1];
    c.sum[2] += points[i].sum[2];
    c.weight += points[i].weight;
  }
  return clusters
    .filter((c) => c.weight)
    .map((c) => {
      const rgb = c.sum.map((v) => Math.round(v / c.weight));
      return { rgb, lab: rgbToLab(rgb), weight: c.weight };
    });
}

// data: RGBA bytes (ImageData.data). Returns up to `count` colours, [{ hex, rgb: [r, g, b], share }],
// largest share first; shares add up to 1. Fewer colours when the image has fewer; [] when it's all transparent.
export function extractPalette(data, count = 5) {
  const k = PALETTE_COUNTS.includes(count) ? count : 5;
  const points = groupPixels(data);
  if (!points.length) return [];
  const clusters = kmeans(points, Math.min(k * 2, points.length), seeded(0x1b8f7c)).sort((a, b) => b.weight - a.weight);
  // Largest first, skipping colours that look like one already chosen.
  const chosen = [];
  for (const c of clusters) {
    if (chosen.length === k) break;
    if (chosen.every((o) => Math.sqrt(dist2(o.lab, c.lab)) >= MERGE_DE)) chosen.push(c);
  }
  // Shares: the part of the image closest to each chosen colour.
  const weights = chosen.map(() => 0);
  let total = 0;
  for (const p of points) {
    weights[nearest(p.lab, chosen.map((c) => c.lab))] += p.weight;
    total += p.weight;
  }
  return chosen
    .map((c, i) => ({ hex: rgbToHex(c.rgb), rgb: c.rgb, share: weights[i] / total }))
    .sort((a, b) => b.share - a.share);
}

// ---- Formats ----

export const rgbToHex = ([r, g, b]) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;

export function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex ?? "").trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHsl([r, g, b]) {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === R ? (G - B) / d + (G < B ? 6 : 0) : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return [Math.round(h * 60) % 360, Math.round(s * 100), Math.round(l * 100)];
}

export const COLOUR_FORMATS = ["hex", "rgb", "hsl"];

// One colour as text: "#C8A27A", "rgb(200, 162, 122)" or "hsl(31, 43%, 63%)".
export function colourText(hex, format = "hex") {
  const rgb = hexToRgb(hex);
  if (!rgb) return "";
  if (format === "rgb") return `rgb(${rgb.join(", ")})`;
  if (format === "hsl") {
    const [h, s, l] = rgbToHsl(rgb);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  return rgbToHex(rgb);
}

export const CODE_FORMATS = ["css", "tailwind", "json", "list"];

// The whole palette as code, in the chosen colour format.
export function paletteCode(hexes, kind, format = "hex") {
  const values = hexes.map((h) => colourText(h, format)).filter(Boolean);
  if (kind === "css") return `:root {\n${values.map((v, i) => `  --color-${i + 1}: ${v};`).join("\n")}\n}`;
  if (kind === "tailwind") return `colors: {\n  palette: {\n${values.map((v, i) => `    ${i + 1}: "${v}",`).join("\n")}\n  },\n},`;
  if (kind === "json") return JSON.stringify(values, null, 2);
  return values.join("\n");
}

export const toCssVars = (hexes, format) => paletteCode(hexes, "css", format);

// Only clean "#RRGGBB" values, at most 12: what a window may ask to save.
export function cleanHexes(list) {
  if (!Array.isArray(list)) return [];
  return list.map((h) => hexToRgb(h)).filter(Boolean).slice(0, 12).map(rgbToHex);
}

// GIMP palette (.gpl), also read by Inkscape and Krita.
export function toGpl(hexes, name = "Imgkeep palette") {
  const title = String(name).replace(/[\r\n]+/g, " ").slice(0, 100) || "Imgkeep palette";
  const rows = hexes.map((h) => {
    const [r, g, b] = hexToRgb(h);
    return `${String(r).padStart(3)} ${String(g).padStart(3)} ${String(b).padStart(3)}\t${h.replace("#", "").toUpperCase()}`;
  });
  return `GIMP Palette\nName: ${title}\nColumns: ${Math.min(hexes.length, 12) || 1}\n#\n${rows.join("\n")}\n`;
}

// Adobe Swatch Exchange (.ase), for Illustrator, Photoshop and InDesign: version 1.0, one RGB swatch per
// colour, named by its HEX value. Big-endian throughout; names are UTF-16 with a closing zero.
export function toAse(hexes) {
  const blocks = hexes.map((h) => {
    const name = h.toUpperCase();
    const nameUnits = name.length + 1;
    const length = 2 + nameUnits * 2 + 4 + 12 + 2;
    const buf = new DataView(new ArrayBuffer(6 + length));
    buf.setUint16(0, 0x0001); // colour entry
    buf.setUint32(2, length);
    buf.setUint16(6, nameUnits);
    let o = 8;
    for (const ch of name) {
      buf.setUint16(o, ch.charCodeAt(0));
      o += 2;
    }
    buf.setUint16(o, 0);
    o += 2;
    for (const ch of "RGB ") buf.setUint8(o++, ch.charCodeAt(0));
    for (const v of hexToRgb(h)) {
      buf.setFloat32(o, v / 255);
      o += 4;
    }
    buf.setUint16(o, 2); // a normal (process) colour
    return new Uint8Array(buf.buffer);
  });
  const head = new DataView(new ArrayBuffer(12));
  [0x41, 0x53, 0x45, 0x46].forEach((c, i) => head.setUint8(i, c)); // "ASEF"
  head.setUint16(4, 1);
  head.setUint16(6, 0);
  head.setUint32(8, blocks.length);
  const out = new Uint8Array(12 + blocks.reduce((s, b) => s + b.length, 0));
  out.set(new Uint8Array(head.buffer), 0);
  let o = 12;
  for (const b of blocks) {
    out.set(b, o);
    o += b.length;
  }
  return out;
}

// Text colour that stays readable on a swatch.
export const inkFor = (hex) => (rgbToLab(hexToRgb(hex))[0] > 60 ? "#1C2321" : "#FFFFFF");
