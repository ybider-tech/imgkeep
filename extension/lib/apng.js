// APNG output (animated PNG, since 0.15.0): every frame in full colour with transparency, unlike GIF's
// 256 colours. Pure JS on top of the browser's own PNG encoder: each frame is drawn on a canvas and encoded as a
// PNG, and its compressed image data is moved into one APNG (frame 1 in IDAT, the others in fdAT chunks). No
// WebAssembly, no chrome.* and no network. Files are saved as .png, which every app opens (apps that don't play
// APNG show the first frame).

import { JobError } from "./job-error.js";

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

const u32 = (...values) => {
  const out = new Uint8Array(values.length * 4);
  const view = new DataView(out.buffer);
  values.forEach((v, i) => view.setUint32(i * 4, v));
  return out;
};

// The chunks of a PNG file: [{ type, data }].
export function pngChunks(bytes) {
  if (!SIGNATURE.every((b, i) => bytes[i] === b)) throw new JobError("unsupported");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chunks = [];
  for (let at = 8; at + 12 <= bytes.length; ) {
    const length = view.getUint32(at);
    const type = String.fromCharCode(...bytes.subarray(at + 4, at + 8));
    chunks.push({ type, data: bytes.subarray(at + 8, at + 8 + length) });
    at += 12 + length;
    if (type === "IEND") break;
  }
  return chunks;
}

// The delay of one frame as an APNG fraction (milliseconds over 1000), within what the format holds.
const delay = (ms) => Math.min(65535, Math.max(0, Math.round(Number(ms) || 0)));

// frames: async iterable of { source (anything drawImage takes), delayMs }. Returns an image/png Blob that plays
// forever, like the GIFs Imgkeep makes. One frame in memory at a time while drawing; the compressed frames are
// kept until the file is put together.
export async function encodeApng(frames, { width, height, deadline = Infinity }) {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  let header = null;
  const encoded = [];
  for await (const { source, delayMs } of frames) {
    if (Date.now() > deadline) throw new JobError("timeout");
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(source, 0, 0, width, height);
    const chunks = pngChunks(new Uint8Array(await (await canvas.convertToBlob({ type: "image/png" })).arrayBuffer()));
    header ??= chunks.find((c) => c.type === "IHDR").data.slice();
    encoded.push({ delayMs, data: chunks.filter((c) => c.type === "IDAT").map((c) => c.data.slice()) });
  }
  if (!header || !encoded.length) throw new JobError("decode");

  const parts = [new Uint8Array(SIGNATURE), chunk("IHDR", header), chunk("acTL", u32(encoded.length, 0))];
  let seq = 0;
  encoded.forEach(({ delayMs, data }, i) => {
    // fcTL: sequence, size, offset 0,0, delay (ms/1000), dispose none, blend source (every frame is complete).
    const fctl = new Uint8Array(26);
    fctl.set(u32(seq++, width, height, 0, 0), 0);
    new DataView(fctl.buffer).setUint16(20, delay(delayMs));
    new DataView(fctl.buffer).setUint16(22, 1000);
    parts.push(chunk("fcTL", fctl));
    for (const d of data) {
      if (i === 0) parts.push(chunk("IDAT", d));
      else {
        const fdat = new Uint8Array(4 + d.length);
        fdat.set(u32(seq++), 0);
        fdat.set(d, 4);
        parts.push(chunk("fdAT", fdat));
      }
    }
  });
  parts.push(chunk("IEND", new Uint8Array(0)));
  return new Blob(parts, { type: "image/png" });
}
