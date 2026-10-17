// Copies the extension's conversion code to the website's Free Image Converter (site/convert/lib and
// site/convert/vendor), so both run the same code. GitHub Pages only serves site/, hence copies.
// tests/site.spec.mjs fails if a copy differs from the extension's file. Run: npm run site-lib
import { copyFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const SITE_LIB = ["convert", "image", "gif", "gifenc", "pdf", "ico", "bmp", "avif", "settings", "job-error"].map((f) => `lib/${f}.js`);
export const SITE_VENDOR = ["vendor/avif/avif_enc.js", "vendor/avif/avif_enc.wasm", "vendor/avif/LICENSE-jsquash", "vendor/avif/LICENSE-libavif", "vendor/avif/LICENSE-libaom", "vendor/avif/PATENTS-libaom", "vendor/avif/README"];

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const file of [...SITE_LIB, ...SITE_VENDOR]) {
    const to = join(ROOT, "site", "convert", file);
    await mkdir(dirname(to), { recursive: true });
    await copyFile(join(ROOT, "extension", file), to);
  }
  console.log(`Copied ${SITE_LIB.length + SITE_VENDOR.length} files to site/convert/`);
}
