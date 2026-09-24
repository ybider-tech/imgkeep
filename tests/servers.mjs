// Two tiny static servers on 127.0.0.1: one sends CORS headers, one doesn't.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync, crc32 } from "node:zlib";
import { randomBytes } from "node:crypto";

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

function pngChunk(tag, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(tag, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

// Encodes raw RGBA pixels as a PNG (used for fixtures and the large noise image).
export function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

let bigPng;
function big() {
  // Random noise doesn't compress, so the converted PNG is several MB (tests the blob: URL path).
  bigPng ??= (() => {
    const w = 1100, h = 1100;
    const px = randomBytes(w * h * 4);
    for (let i = 3; i < px.length; i += 4) px[i] = 255;
    return encodePng(w, h, px);
  })();
  return bigPng;
}

export function startServer({ cors, root = FIXTURES }) {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const headers = cors ? { "Access-Control-Allow-Origin": "*" } : {};
    try {
      let body;
      if (path === "/big.png") body = big();
      else if (path.includes("..")) throw new Error("bad path");
      else body = await readFile(join(root, path.endsWith("/") ? `${path}index.html` : path));
      res.writeHead(200, { ...headers, "Content-Type": TYPES[extname(path)] || "application/octet-stream", "Cache-Control": "no-store" });
      res.end(body);
    } catch {
      res.writeHead(404, { ...headers, "Content-Type": "text/plain" });
      res.end("not found");
    }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ url: `http://127.0.0.1:${port}`, close: () => new Promise((r) => server.close(r)) });
    });
  });
}
