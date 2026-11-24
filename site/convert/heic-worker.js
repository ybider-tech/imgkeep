// Decodes HEIC/HEIF photos for the Free Image Converter, off the page, so a 48 MP photo doesn't freeze the tab.
// heic.js starts this worker only when a HEIC photo is added and the browser can't open it itself.
// The decoder is libheif (WebAssembly, ./vendor/heic, this site's own files): nothing leaves this device.
//
// In:  { id, buffer }  the photo's bytes
// Out: { id, blob, width, height }  a lossless PNG in sRGB, or { id, error: "decode" | "load" }
//
// Only the primary image is used (an iPhone file can also hold thumbnails, depth maps or burst frames).
// libheif applies the file's rotation and mirroring (its irot and imir properties), which is how iPhones
// store orientation in HEIC. iPhone photos are in Display P3; they're converted to sRGB here, the colours
// every output format and app assumes, the same way a browser shows a P3 photo on an sRGB screen.
importScripts("vendor/heic/libheif.js");

let module = null;
function load() {
  module ??= fetch(new URL("vendor/heic/libheif.wasm", self.location.href))
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.arrayBuffer();
    })
    .then(
      (wasmBinary) =>
        new Promise((resolve, reject) => {
          // With the bytes handed over, the runtime starts at once and calls back with itself.
          self.libheif({
            wasmBinary,
            onRuntimeInitialized() {
              resolve(this);
            },
            onAbort: reject,
          });
        }),
    );
  module.catch(() => (module = null)); // a failed load can be tried again with the next photo
  return module;
}

self.onmessage = async ({ data: { id, buffer } }) => {
  let m;
  try {
    m = await load();
  } catch {
    self.postMessage({ id, error: "load" });
    return;
  }
  try {
    const bytes = new Uint8Array(buffer);
    if (truncated(bytes)) throw new Error("truncated");
    const { width, height, rgba } = decode(m, bytes);
    if (isDisplayP3(bytes)) p3ToSrgb(rgba);
    const canvas = new OffscreenCanvas(width, height);
    canvas.getContext("2d").putImageData(new ImageData(rgba, width, height), 0, 0);
    const blob = await canvas.convertToBlob({ type: "image/png" });
    self.postMessage({ id, blob, width, height });
  } catch {
    self.postMessage({ id, error: "decode" });
  }
};

// Cut short (an interrupted download or copy)? libheif decodes what's there and leaves the rest grey, so the
// file's top-level boxes are checked first: each must end within the file.
function truncated(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let at = 0;
  while (at + 8 <= bytes.length) {
    let size = view.getUint32(at);
    if (size === 1) {
      if (at + 16 > bytes.length) return true;
      size = Number(view.getBigUint64(at + 8)); // a 64-bit size
    } else if (size === 0) return false; // the last box runs to the end of the file
    if (size < 8 || at + size > bytes.length) return true;
    at += size;
  }
  return at !== bytes.length;
}

// The primary image as RGBA, rows packed. Everything libheif allocated is released, even on failure.
function decode(m, bytes) {
  const ctx = m.heif_context_alloc();
  let handle = null;
  let image = null;
  try {
    const err = m.heif_context_read_from_memory(ctx, bytes);
    if (err.code !== m.heif_error_code.heif_error_Ok) throw new Error(err.message);
    handle = m.heif_js_context_get_primary_image_handle(ctx);
    if (!handle || handle.code) throw new Error("no primary image");
    image = m.heif_js_decode_image2(handle, m.heif_colorspace.heif_colorspace_RGB, m.heif_chroma.heif_chroma_interleaved_RGBA);
    if (!image || image.code) throw new Error("decode failed");
    const plane = image.channels.find((c) => c.id == m.heif_channel.heif_channel_interleaved);
    if (!plane) throw new Error("no image data");
    const { width, height, stride, data } = plane;
    const row = width * 4;
    const rgba = new Uint8ClampedArray(row * height); // a copy: data lives in libheif's memory
    if (stride === row) rgba.set(data.subarray(0, row * height));
    else for (let y = 0; y < height; y++) rgba.set(data.subarray(y * stride, y * stride + row), y * row);
    return { width, height, rgba };
  } finally {
    if (image?.image) m.heif_image_release(image.image);
    if (handle && !handle.code) m.heif_image_handle_release(handle);
    m.heif_context_free(ctx);
  }
}

// Is the photo in Display P3? iPhones embed Apple's "Display P3" ICC profile (its name is stored as UTF-16 or
// ASCII); other cameras may say so with an nclx colour box (colour primaries 12). The boxes that say this come
// before the image data, so the first megabyte is enough.
function isDisplayP3(bytes) {
  const head = bytes.subarray(0, Math.min(bytes.length, 1 << 20));
  const find = (needle) => {
    outer: for (let i = 0; i + needle.length <= head.length; i++) {
      for (let j = 0; j < needle.length; j++) if (head[i + j] !== needle[j]) continue outer;
      return i;
    }
    return -1;
  };
  const ascii = (s) => [...s].map((c) => c.charCodeAt(0));
  const utf16 = (s) => [...s].flatMap((c) => [0, c.charCodeAt(0)]);
  if (find(ascii("Display P3")) >= 0 || find(utf16("Display P3")) >= 0) return true;
  const nclx = find(ascii("colrnclx"));
  return nclx >= 0 && ((head[nclx + 8] << 8) | head[nclx + 9]) === 12;
}

// Display P3 → sRGB, in place. Both use the sRGB tone curve; between them is a 3 × 3 matrix on linear light.
// Colours outside sRGB are clipped, as a browser does on an sRGB screen. Alpha is untouched.
const M = [
  [1.2249401, -0.2249404, 0],
  [-0.0420569, 1.0420571, 0],
  [-0.0196376, -0.0786361, 1.0982735],
];
const LINEAR = new Float32Array(256).map((_, i) => {
  const c = i / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
});
const STEPS = 16384;
const ENCODE = new Uint8ClampedArray(STEPS + 1).map((_, i) => {
  const l = i / STEPS;
  return Math.round(255 * (l <= 0.0031308 ? 12.92 * l : 1.055 * l ** (1 / 2.4) - 0.055));
});
function p3ToSrgb(px) {
  const enc = (l) => ENCODE[l <= 0 ? 0 : l >= 1 ? STEPS : (l * STEPS + 0.5) | 0];
  for (let i = 0; i < px.length; i += 4) {
    const r = LINEAR[px[i]];
    const g = LINEAR[px[i + 1]];
    const b = LINEAR[px[i + 2]];
    px[i] = enc(M[0][0] * r + M[0][1] * g);
    px[i + 1] = enc(M[1][0] * r + M[1][1] * g);
    px[i + 2] = enc(M[2][0] * r + M[2][1] * g + M[2][2] * b);
  }
}
