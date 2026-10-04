// Making GIFs, locally: find the real image type, read animation frames one at a time,
// and encode any stream of frames with gifenc.
//
// encodeGif() takes an async iterable of { source, delayMs } frames, where source is anything
// drawImage accepts. Today the frames come from ImageDecoder (animated WebP, AVIF, APNG) or a
// single still image; later they can come from a <video> element without changing the encoder.

import { GIFEncoder, quantize, applyPalette } from "./gifenc.js";
import { JobError } from "./job-error.js";
import { GIF_LIMITS } from "./settings.js";
import { fitWidth } from "./image.js";

const DEFAULT_DELAY_MS = 100; // when a frame has no duration

// A GIF's width and height from its header (bytes 6–9, little-endian).
export async function gifSize(blob) {
  const b = new Uint8Array(await blob.slice(6, 10).arrayBuffer());
  return { width: b[0] | (b[1] << 8), height: b[2] | (b[3] << 8) };
}

// Opens an animated image with ImageDecoder. Returns null when it isn't animated
// (or this browser can't decode the type that way), so the caller treats it as a still image.
export async function openAnimation(blob, type) {
  if (!("ImageDecoder" in globalThis) || !type || !(await ImageDecoder.isTypeSupported(type))) return null;
  const decoder = new ImageDecoder({ data: await blob.arrayBuffer(), type });
  try {
    await decoder.tracks.ready;
    await decoder.completed; // the whole file is parsed, so frameCount is final
  } catch {
    decoder.close();
    throw new JobError("decode");
  }
  const track = decoder.tracks.selectedTrack;
  if (!track?.animated || track.frameCount < 2) {
    decoder.close();
    return null;
  }
  const { image: first } = await decoder.decode({ frameIndex: 0 });
  const width = first.displayWidth;
  const height = first.displayHeight;
  first.close();
  return {
    width,
    height,
    frameCount: track.frameCount,
    close: () => decoder.close(),
    // One decoded frame in memory at a time; each is closed once the encoder has used it.
    async *frames() {
      for (let i = 0; i < track.frameCount; i++) {
        const { image } = await decoder.decode({ frameIndex: i });
        try {
          // ImageDecoder durations are in microseconds.
          yield { source: image, delayMs: image.duration ? image.duration / 1000 : DEFAULT_DELAY_MS };
        } finally {
          image.close();
        }
      }
    },
  };
}

// A still image as a one-frame stream.
export async function* stillFrame(source) {
  yield { source, delayMs: 0 };
}

export function checkLimits({ width, height, frameCount }) {
  if (frameCount > GIF_LIMITS.maxFrames) {
    throw new JobError("too-large", "@detailGifFrames", [String(frameCount), String(GIF_LIMITS.maxFrames)]);
  }
  if (width * height * frameCount > GIF_LIMITS.maxTotalPixels) {
    throw new JobError("too-large", "@detailGifPixels", [String(width), String(height), String(frameCount)]);
  }
}

// GIF width: at most GIF_LIMITS.maxWidth, or the user's maximum width if that is smaller. Never scales up.
export function fitGif(width, height, maxWidth) {
  const max = maxWidth > 0 ? Math.min(maxWidth, GIF_LIMITS.maxWidth) : GIF_LIMITS.maxWidth;
  return fitWidth(width, height, max);
}

// GIF has 1-bit transparency: pixels under half opacity become fully transparent, the rest opaque.
// Returns true if the frame has any transparent pixel.
function snapAlpha(rgba) {
  let any = false;
  for (let i = 3; i < rgba.length; i += 4) {
    if (rgba[i] < 128) {
      rgba[i - 3] = rgba[i - 2] = rgba[i - 1] = rgba[i] = 0;
      any = true;
    } else {
      rgba[i] = 255;
    }
  }
  return any;
}

// GIF delays are in hundredths of a second, and browsers slow anything under 20 ms down to 100 ms.
function gifDelay(ms) {
  return ms > 0 ? Math.max(20, Math.round(ms / 10) * 10) : 0;
}

// Encodes the frames into a GIF Blob at width × height. Stops with "timeout" after `deadline` (ms since epoch).
export async function encodeGif(frames, { width, height, deadline = Infinity }) {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const gif = GIFEncoder();
  let count = 0;
  for await (const { source, delayMs } of frames) {
    if (Date.now() > deadline) throw new JobError("timeout");
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(source, 0, 0, width, height);
    const rgba = ctx.getImageData(0, 0, width, height).data;
    const transparent = snapAlpha(rgba);
    // With transparency, one palette slot is reserved for "see-through" so it doesn't turn black.
    const format = transparent ? "rgba4444" : "rgb565";
    const palette = quantize(rgba, 256, { format, oneBitAlpha: transparent });
    const index = applyPalette(rgba, palette, format);
    const transparentIndex = transparent ? palette.findIndex((c) => c[3] === 0) : -1;
    gif.writeFrame(index, width, height, {
      palette,
      delay: gifDelay(delayMs),
      transparent: transparentIndex >= 0,
      transparentIndex,
      dispose: 2, // each frame is complete: clear it before the next one is drawn
    });
    count++;
  }
  if (!count) throw new JobError("decode");
  gif.finish();
  return new Blob([gif.bytesView()], { type: "image/gif" });
}
