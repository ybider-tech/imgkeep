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
