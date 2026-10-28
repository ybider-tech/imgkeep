// Serves store/i18n/<lang>.json on 127.0.0.1 so a store dashboard tab (Edge Partner Center) can read the
// exact texts while they're filled in by browser automation, instead of retyping them. Local only, read only,
// and only these files. Stop it with Ctrl+C.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "store", "i18n");
const PORT = Number(process.env.PORT || 8977);
const ORIGINS = ["https://partner.microsoft.com"];

createServer(async (req, res) => {
  const origin = ORIGINS.includes(req.headers.origin) ? req.headers.origin : "";
  const headers = { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Private-Network": "true", "Cache-Control": "no-store" };
  if (req.method === "OPTIONS") return res.writeHead(204, headers).end();
  const m = /^\/([a-zA-Z_]{2,6})\.json$/.exec(new URL(req.url, "http://x").pathname);
  if (!origin || !m) return res.writeHead(404, headers).end();
  try {
    res.writeHead(200, { ...headers, "Content-Type": "application/json; charset=utf-8" }).end(await readFile(join(DIR, `${m[1]}.json`)));
  } catch {
    res.writeHead(404, headers).end();
  }
}).listen(PORT, "127.0.0.1", () => console.log(`store/i18n on http://127.0.0.1:${PORT}/<lang>.json`));
