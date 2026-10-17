// AVIF output (More options): the image goes through libavif, the reference AVIF encoder, compiled to
// WebAssembly (vendor/avif, pinned by tests/static-check.mjs). Browsers can read AVIF but can't write it.
// offscreen.js loads the encoder on first use and passes it in; this file only sets the options.

// libavif's options as @jsquash/avif 2.1.1 sets them, with a faster speed: 8 encodes a 1600 × 1000 photo in
// about 0.35 s instead of about 2 s at 6, for files about a quarter bigger.
export const AVIF_OPTIONS = {
  quality: 60,
  qualityAlpha: -1, // the same quality for transparency
  denoiseLevel: 0,
  tileColsLog2: 0,
  tileRowsLog2: 0,
  speed: 8,
  subsample: 1,
  chromaDeltaQ: false,
  sharpness: 0,
  tune: 0,
  enableSharpYUV: false,
  bitDepth: 8,
  lossless: false,
};

// The quality slider's default for AVIF: about the look of JPG at 85, at roughly half the size.
export const AVIF_DEFAULT_QUALITY = 60;

// rgba: canvas pixels. Returns the .avif bytes.
export function encodeAvif(encoder, rgba, width, height, quality) {
  const q = Math.min(100, Math.max(1, Math.round(Number(quality) || AVIF_DEFAULT_QUALITY)));
  const out = encoder.encode(new Uint8Array(rgba.buffer, rgba.byteOffset, rgba.byteLength), width, height, { ...AVIF_OPTIONS, quality: q });
  if (!out) throw new Error("AVIF encoder returned nothing");
  return new Uint8Array(out);
}
