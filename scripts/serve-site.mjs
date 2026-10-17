// Serves site/ locally like GitHub Pages (correct types for .js and .wasm). Run: node scripts/serve-site.mjs
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { startServer } from "../tests/servers.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const { url } = await startServer({ cors: false, root, port: Number(process.env.PORT) || 4321 });
console.log(`Serving site/ at ${url}`);
