// Unit tests for file-name templating (runs in Node, no browser).
import { test, expect } from "@playwright/test";
import { nameFromUrl, hostFromUrl, extFromUrl, fillTemplate, sanitizeSegment, buildTarget, targetPath, tokensFor } from "../extension/lib/settings.js";

const now = new Date(2026, 8, 24, 9, 5, 7);

test("name, host and extension from URLs", () => {
  expect(nameFromUrl("https://www.shop.example.com/a/Summer%20Banner.webp?x=1")).toBe("Summer Banner");
  expect(nameFromUrl("https://example.com/")).toBe("image");
  expect(nameFromUrl("data:image/png;base64,AAAA")).toBe("image");
  expect(hostFromUrl("https://www.shop.example.com/a.png")).toBe("shop.example.com");
  expect(hostFromUrl("data:image/png;base64,AAAA")).toBe("");
  expect(extFromUrl("https://x.com/a.JPEG")).toBe("jpg");
  expect(extFromUrl("https://x.com/photo")).toBe("");
  expect(extFromUrl("data:image/svg+xml;utf8,<svg>")).toBe("svg");
});

test("tokens and templates", () => {
  const t = tokensFor({ url: "https://www.example.com/cat.png", width: 10, height: 20, now });
  expect(t).toEqual({ name: "cat", host: "example.com", date: "2026-09-24", time: "090507", w: "10", h: "20" });
  expect(fillTemplate("{date}_{name}-{w}x{h}", t)).toBe("2026-09-24_cat-10x20");
  // Unknown size (Original format) drops the size token and its separator.
  expect(fillTemplate("{name}-{w}x{h}", { ...t, w: "", h: "" })).toBe("cat");
  expect(fillTemplate("{host}-{name}", { ...t, host: "" })).toBe("cat");
  expect(fillTemplate("{name} - copy", t)).toBe("cat - copy");
});

test("sanitising path segments", () => {
  expect(sanitizeSegment('a<b>c:d"e|f?g*h')).toBe("abcdefgh");
  expect(sanitizeSegment("  ..hidden.. ")).toBe("hidden");
  expect(sanitizeSegment("CON")).toBe("CON_");
  expect(sanitizeSegment("x".repeat(200))).toHaveLength(120);
});

test("building the target path", () => {
  const settings = { subfolder: "Imgkeep/{host}//../{date}", filenameTemplate: "{name}" };
  const target = buildTarget({ settings, url: "https://www.example.com/a/b/cat.png", width: 1, height: 1, ext: "png", now });
  expect(targetPath(target)).toBe("Imgkeep/example.com/2026-09-24/cat.png");
  const empty = buildTarget({ settings: { subfolder: "", filenameTemplate: "" }, url: "data:image/png;base64,AA", ext: "jpg", now });
  expect(targetPath(empty)).toBe("image.jpg");
});

test("GIF size and limits", async () => {
  const { fitGif: fitWidth, checkLimits } = await import("../extension/lib/gif.js");
  const { GIF_LIMITS, FORMATS } = await import("../extension/lib/settings.js");
  expect(FORMATS.gif).toMatchObject({ mime: "image/gif", ext: "gif", animated: true });
  expect(fitWidth(1000, 100)).toEqual({ width: 800, height: 80 });
  expect(fitWidth(320, 200)).toEqual({ width: 320, height: 200 }); // never scales up
  expect(() => checkLimits({ width: 8, height: 8, frameCount: GIF_LIMITS.maxFrames })).not.toThrow();
  expect(() => checkLimits({ width: 8, height: 8, frameCount: GIF_LIMITS.maxFrames + 1 })).toThrow("too-large");
  expect(() => checkLimits({ width: 4000, height: 4000, frameCount: 10 })).toThrow("too-large");
  expect(fitWidth(1000, 100, 500)).toEqual({ width: 500, height: 50 }); // the user's maximum width, if smaller
  expect(fitWidth(1000, 100, 2000)).toEqual({ width: 800, height: 80 });
});

test("Resize: maximum width keeps the shape and never enlarges", async () => {
  const { fitWidth, cleanMaxWidth } = await import("../extension/lib/image.js");
  expect(fitWidth(2400, 1200, 1600)).toEqual({ width: 1600, height: 800 });
  expect(fitWidth(1200, 600, 1600)).toEqual({ width: 1200, height: 600 });
  expect(fitWidth(2400, 1200, 0)).toEqual({ width: 2400, height: 1200 });
  expect(fitWidth(3000, 1, 1000)).toEqual({ width: 1000, height: 1 }); // never 0 pixels high
  expect(cleanMaxWidth("1600")).toBe(1600);
  expect(cleanMaxWidth(" 800.7 ")).toBe(800);
  for (const v of ["", "0", "-5", "abc", null, undefined]) expect(cleanMaxWidth(v)).toBe(0);
});

test("Output check: the type comes from the bytes", async () => {
  const { typeFromBytes, EXT_BY_TYPE } = await import("../extension/lib/image.js");
  const bytes = (...parts) => new Uint8Array(Buffer.concat(parts.map((p) => Buffer.from(p))));
  expect(typeFromBytes(bytes([0x89], "PNG\r\n\x1a\n", "rest...."))).toBe("image/png");
  expect(typeFromBytes(bytes([0xff, 0xd8, 0xff, 0xe0], "JFIF\0\0\0\0\0\0\0\0"))).toBe("image/jpeg");
  expect(typeFromBytes(bytes("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
  expect(typeFromBytes(bytes("GIF89a\0\0\0\0\0\0\0\0\0\0"))).toBe("image/gif");
  expect(typeFromBytes(bytes("%PDF-1.4\n%\0\0\0\0\0\0"))).toBe("application/pdf");
  expect(typeFromBytes(bytes("<svg xmlns=...>  "))).toBe("");
  expect(EXT_BY_TYPE["image/jpeg"]).toBe("jpg");
});

test("Size cap: highest tested quality that fits, bounded tries, clear failure", async () => {
  const { encodeUnder, KB, MB } = await import("../extension/lib/image.js");
  expect([KB, MB]).toEqual([1000, 1_000_000]);
  // A fake encoder: 10 KB per quality point.
  const tried = [];
  const encodeAt = async (q) => (tried.push(q), new Blob([new Uint8Array(q * 10 * KB)]));
  const ok = await encodeUnder(encodeAt, { quality: 92, maxBytes: 800 * KB });
  expect(ok.quality).toBe(80);
  expect(ok.blob.size).toBeLessThanOrEqual(800 * KB);
  expect(tried.length).toBeLessThanOrEqual(7);
  // Fits at the starting quality: one try.
  tried.length = 0;
  expect((await encodeUnder(encodeAt, { quality: 92, maxBytes: MB })).quality).toBe(92);
  expect(tried).toEqual([92]);
  // Even the floor (70) is too big: fails with the smallest size reached.
  await expect(encodeUnder(encodeAt, { quality: 92, maxBytes: 200 * KB })).rejects.toMatchObject({
    code: "size-unreachable",
    subs: [String(70 * 10 * KB)],
  });
});

test("Typed names from More options", async () => {
  const { buildTarget, targetPath, cleanColour } = await import("../extension/lib/settings.js");
  const settings = { subfolder: "Imgkeep", filenameTemplate: "{name}-{w}" };
  const url = "https://example.com/a/photo.webp";
  expect(targetPath(buildTarget({ settings, url, width: 10, height: 5, ext: "jpg", name: "My shot.png" }))).toBe("Imgkeep/My shot.jpg");
  expect(targetPath(buildTarget({ settings, url, width: 10, height: 5, ext: "jpg", name: "  " }))).toBe("Imgkeep/photo-10.jpg");
  expect(targetPath(buildTarget({ settings, url, width: 10, height: 5, ext: "png", name: "a/b:c*" }))).toBe("Imgkeep/abc.png");
  expect(cleanColour("#ABCDEF")).toBe("#abcdef");
  expect(cleanColour("red")).toBe("#ffffff");
});

test("PDF page size: 1 px = 1 pt, scaled down past the 14,400 pt limit", async () => {
  const { pageSize } = await import("../extension/lib/pdf.js");
  const { FORMATS } = await import("../extension/lib/settings.js");
  expect(FORMATS.pdf).toMatchObject({ mime: "application/pdf", ext: "pdf" });
  expect(pageSize(320, 200)).toEqual({ width: 320, height: 200 });
  expect(pageSize(28800, 1000)).toEqual({ width: 14400, height: 500 });
});
