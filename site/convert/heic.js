// HEIC/HEIF photos (what iPhones save) in the Free Image Converter. Chrome, Edge and Firefox can't open them,
// so the photo goes to heic-worker.js, which decodes it on this device with libheif (WebAssembly, from this
// site's vendor/heic, loaded only now) and hands back a lossless PNG; from there it's converted like any
// other image. Safari opens HEIC itself, so there the file is used as it is and nothing extra loads.
// Website only: the extension never sees HEIC (browsers don't show it on web pages).

// HEIC, by its first bytes: an ISO media file (ftyp) whose brands say HEVC images. AVIF uses the same
// container (and can share the generic mif1 brand), so anything that lists an AVIF brand is left to AVIF.
const HEVC_BRANDS = new Set(["heic", "heix", "heim", "heis", "hevc", "hevx"]);
export function isHeicBytes(b) {
  if (b.length < 12) return false;
  const text = (i) => String.fromCharCode(b[i], b[i + 1], b[i + 2], b[i + 3]);
  if (text(4) !== "ftyp") return false;
  const end = Math.min(b.length, ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0);
  const brands = [text(8)];
  for (let i = 16; i + 4 <= end; i += 4) brands.push(text(i)); // the compatible brands
  if (brands.some((x) => x === "avif" || x === "avis")) return false;
  return brands.some((x) => HEVC_BRANDS.has(x)) || ["mif1", "msf1"].includes(brands[0]);
}

export class HeicError extends Error {
  constructor(code) {
    super(code);
    this.code = code; // "heic" (couldn't be decoded) or "heic-load" (the decoder didn't load)
  }
}

// Safari decodes HEIC itself: asked once, with the first HEIC photo.
let native = null;
const opensNatively = (file) => (native ??= createImageBitmap(file).then((bmp) => (bmp.close(), true), () => false));

let worker = null;
let nextId = 1;
const pending = new Map();
function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./heic-worker.js", import.meta.url));
  worker.onmessage = ({ data }) => {
    const job = pending.get(data.id);
    pending.delete(data.id);
    if (data.error) job?.reject(new HeicError(data.error === "load" ? "heic-load" : "heic"));
    else job?.resolve(data.blob);
  };
  // The worker itself failed (out of memory on a huge photo, or its script didn't load): fail what it held
  // and start a fresh one next time.
  worker.onerror = (e) => {
    e.preventDefault();
    for (const job of pending.values()) job.reject(new HeicError("heic"));
    pending.clear();
    worker.terminate();
    worker = null;
  };
  return worker;
}

// The image to convert: the file itself, or for a HEIC photo the browser can't open, its decoded PNG.
// Resolves to { blob, heic } (heic: the file is a HEIC photo, by its bytes: a JPG named .heic stays a JPG).
export async function openImage(file) {
  const heic = isHeicBytes(new Uint8Array(await file.slice(0, 64).arrayBuffer()));
  if (!heic) return { blob: file, heic };
  if (await opensNatively(file)) return { blob: file, heic };
  const buffer = await file.arrayBuffer();
  const blob = await new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, buffer }, [buffer]);
  });
  return { blob, heic };
}
