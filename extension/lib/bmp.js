// BMP output (More options): a plain 24-bit Windows bitmap, which every app opens, Paint included.
// BMP's transparency support is patchy across apps, so transparent areas get the chosen background colour,
// like JPG. No library: a 14-byte file header, a 40-byte info header, then rows of BGR pixels, bottom row
// first, each row padded to a multiple of 4 bytes.

// rgba: canvas pixels (Uint8ClampedArray, already drawn on the background). Returns the .bmp bytes.
export function buildBmp(rgba, width, height) {
  const stride = Math.ceil((width * 3) / 4) * 4;
  const pixels = stride * height;
  const out = new Uint8Array(54 + pixels);
  const v = new DataView(out.buffer);
  out[0] = 0x42; // "B"
  out[1] = 0x4d; // "M"
  v.setUint32(2, out.length, true);
  v.setUint32(10, 54, true); // where the pixels start
  v.setUint32(14, 40, true); // BITMAPINFOHEADER
  v.setInt32(18, width, true);
  v.setInt32(22, height, true); // positive: bottom row first
  v.setUint16(26, 1, true); // colour planes
  v.setUint16(28, 24, true); // bits per pixel
  v.setUint32(30, 0, true); // no compression
  v.setUint32(34, pixels, true);
  v.setInt32(38, 2835, true); // 72 dpi, in pixels per metre
  v.setInt32(42, 2835, true);
  for (let y = 0; y < height; y++) {
    const row = 54 + (height - 1 - y) * stride;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const o = row + x * 3;
      out[o] = rgba[i + 2];
      out[o + 1] = rgba[i + 1];
      out[o + 2] = rgba[i];
    }
  }
  return out;
}
