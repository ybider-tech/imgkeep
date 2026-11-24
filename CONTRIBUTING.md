# Contributing to Imgkeep

Thanks for helping. Ideas and votes go in [GitHub Discussions](https://github.com/ybider-tech/imgkeep/discussions/categories/ideas); bugs in [Issues](https://github.com/ybider-tech/imgkeep/issues). This file covers the code: how it's built, tested, translated and released.

## Principles

- **The extension has no build step and no npm dependencies.** Plain JavaScript ES modules in `extension/`. The code you read is the code that runs.
- **Nothing leaves the computer except what the [privacy policy](extension/PRIVACY.md) lists.** Any change to network use, permissions or the daily summary updates `extension/PRIVACY.md`, `PERMISSIONS.md` and `site/privacy.html` first (a test checks the last two match).
- **`tests/static-check.mjs` guards that:** it fails if the permissions change, if `fetch(` appears outside `offscreen.js` and `lib/telemetry.js` (plus one in-page read for `blob:` images in `lib/read-blob.js`), if any extension file references an outside URL, or if the vendored AVIF encoder's bytes change.

## How it works

- **Fetching:** the image you chose is fetched in an offscreen document (`extension/offscreen.js`; in Firefox the background page runs it). With "Save the full-size version" on, `lib/cdn-rules.js` works out the full-size file's address first.
- **Converting:** one pipeline for quick saves, More options and Copy as PNG (`extension/lib/image.js`): fetch, decode, resize, encode, check. GIF via `ImageDecoder` and the vendored [gifenc](https://github.com/mattdesl/gifenc) (`lib/gif.js`); APNG `lib/apng.js`; PDF `lib/pdf.js`; ICO `lib/ico.js`; BMP `lib/bmp.js`; AVIF the vendored libavif WebAssembly encoder (`extension/vendor/avif`, loaded only when used); palettes `lib/palette.js`.
- **Finding covered images:** `lib/find-image.js`, injected with the optional `scripting` permission only when the user asks (Find image here, Alt+S, the toolbar button).
- **Saving:** Downloads, a chosen folder (File System Access API, Chrome and Edge) or ask every time.

## Development

Requirements: Node.js 20 or newer. Node is only for tests, store images and the website tooling.

```bash
npm install
npx playwright install chromium
npm test
```

`npm test` generates missing fixtures, runs the static check, then Playwright. Highlights:

| Test | Covers |
|---|---|
| `tests/extension.spec.mjs` | The real extension in Chromium against local servers: every format, animation, saving modes, the ask window, Options and the menu |
| `tests/tools.spec.mjs` | Checked output, maximum width, transparency, Copy as PNG, More options |
| `tests/find.spec.mjs`, `tests/shortcut.spec.mjs` | Find image here, Alt+S and the toolbar button |
| `tests/original-size.spec.mjs` | Save the full-size version (every rule stays on the same site) |
| `tests/blob.spec.mjs`, `tests/fixtures.spec.mjs` | `blob:` images, site access and the Referer retry |
| `tests/apng.spec.mjs`, `tests/palette.spec.mjs` | APNG and colour palettes |
| `tests/telemetry.spec.mjs` | The anonymous daily summary |
| `tests/firefox.spec.mjs` | The Firefox build in real Firefox |
| `tests/i18n.spec.mjs` | Right-to-left and Japanese layouts (runs in CI; skipped on macOS) |
| `tests/site.spec.mjs`, `tests/converter.spec.mjs` | imgkeep.app and its Free Image Converter |

Other scripts:

| Command | What it does |
|---|---|
| `npm run check` | Static trust check only |
| `npm run build-firefox` | Builds the Firefox version into `dist/firefox/` |
| `npm run package` | Runs the tests, then builds the Chrome, Edge and Firefox zips in `dist/` |
| `npm run icons` | Redraws the icons (Python 3, standard library) |
| `npm run fixtures` | Regenerates test images |
| `npm run site-lib` | Copies `extension/lib` to `site/convert/lib` (the converter uses the same code; a test keeps them identical) |
| `npm run version-css` | After editing `site/style.css`: stamps every page's stylesheet link. A test fails if you forget. |
| `npm run store` | Renders the store images from `store/scenes.html` |

## Translations

Extension text lives in `extension/_locales/<lang>/messages.json`; English (`en`) is the source and the fallback. Pages mark text with `data-i18n` and scripts call `t(key)` from `extension/lib/i18n.js`. Keep `$PLACEHOLDERS$`, `{tokens}`, `<code>`/`<strong>` and the `placeholders` blocks as they are; `npm run check` lists anything missing or broken and checks the store length limits (name ≤ 75 characters, summary ≤ 132).

The website's translations live in `i18n/site/<lang>.json` and are built with `node scripts/translate-site.mjs --build`; English pages in `site/` are the source, translated pages are generated (don't edit them by hand).

## Releasing

`node scripts/release.mjs` shows the plan for the version in `extension/manifest.json`; `--go` runs each step that isn't done yet, stopping at the first failure: translate, test, package, tag, push, upload, listing, then submit to Chrome, Edge and Firefox (`scripts/cws-publish.mjs`, `scripts/edge-publish.sh`, `scripts/amo-publish.mjs`). Store credentials live outside the repo. Don't submit while the previous version is still in review: a new submission replaces it.

Before a release: bump `version` in `extension/manifest.json` and `package.json`, and move the CHANGELOG's notes under the new version. First-time setup (GitHub Pages, domain, store accounts) is in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Repository layout

```
extension/   the extension (load unpacked; the source of every store package)
site/        imgkeep.app (GitHub Pages), including the Free Image Converter
i18n/        the website's translations
data/        facts for the comparison pages (rendered by scripts/build-comparisons.mjs)
tests/       Playwright tests, fixtures, local servers, static check
store/       listing copy, scenes and rendered store images
scripts/     packaging, releasing, translation and site tooling
docs/        DEPLOYMENT.md and release QA reports
```
