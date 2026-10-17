// ICO output (More options): one .ico file holding the image at several icon sizes, each stored as a PNG.
// PNG inside ICO is read by every browser and by Windows since Vista, and keeps transparency.
// No library: an ICO file is a 6-byte header, one 16-byte directory entry per size, then the PNGs.

// Always these sizes (favicons, shortcuts); 256 px too when the image is at least that big.
export const ICO_SIZES = [16, 32, 48];
export const ICO_LARGE = 256;

export function icoSizes(width, height) {
  return Math.max(width, height) >= ICO_LARGE ? [...ICO_SIZES, ICO_LARGE] : [...ICO_SIZES];
}

// Where the image goes inside a square icon: as large as fits, centred, the rest left transparent.
export function fitSquare(width, height, size) {
  const scale = size / Math.max(width, height);
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  return { x: Math.floor((size - w) / 2), y: Math.floor((size - h) / 2), w, h };
}

// images: [{ size, png: Uint8Array }], smallest first. Returns the .ico bytes.
export function buildIco(images) {
  const header = 6 + 16 * images.length;
  const total = header + images.reduce((n, i) => n + i.png.length, 0);
  const out = new Uint8Array(total);
  const v = new DataView(out.buffer);
  v.setUint16(0, 0, true); // reserved
  v.setUint16(2, 1, true); // type: icon
  v.setUint16(4, images.length, true);
  let offset = header;
  images.forEach(({ size, png }, i) => {
    const e = 6 + 16 * i;
    out[e] = size >= 256 ? 0 : size; // 0 means 256
    out[e + 1] = size >= 256 ? 0 : size;
    out[e + 2] = 0; // no palette
    out[e + 3] = 0; // reserved
    v.setUint16(e + 4, 1, true); // colour planes
    v.setUint16(e + 6, 32, true); // bits per pixel
    v.setUint32(e + 8, png.length, true);
    v.setUint32(e + 12, offset, true);
    out.set(png, offset);
    offset += png.length;
  });
  return out;
}
