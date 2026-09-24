# Imgkeep

Right-click any image and save it as PNG, JPG or WebP. Imgkeep converts it on your computer and puts it where you want, every time.

- Four permissions: `contextMenus`, `downloads`, `storage`, `offscreen`. No access to your pages. See [PERMISSIONS.md](PERMISSIONS.md).
- No analytics, no remote code, no network use except fetching the image you clicked.
- No review prompts, welcome tabs, badges or upsells. A small window opens only when a save needs your decision.
- Plain JavaScript ES modules, no build step, no dependencies in the extension.

Website: [imgkeep.app](https://imgkeep.app) · Privacy: [extension/PRIVACY.md](extension/PRIVACY.md) · License: [MIT](LICENSE)

## What it does

Right-click an image → **Imgkeep: Save image as** → **PNG**, **JPG**, **WebP**, or **Original format**.

- Reads WebP, AVIF, SVG, PNG, JPG, GIF (first frame) and `data:` images.
- Converts at the image's natural size in an offscreen document (canvas). JPG gets your background colour behind transparent areas (default white).
- Quality: JPG 92 and WebP 90 by default, adjustable from 50 to 100.
- File names from a template, default `{name}`. Tokens: `{name}` (file name from the URL, `image` for `data:` URLs), `{host}` (without `www.`), `{date}` (YYYY-MM-DD), `{time}` (HHMMSS), `{w}`, `{h}`. The subfolder setting takes the same tokens, e.g. `Imgkeep/{host}`. Characters that are illegal on Windows or macOS are removed.
- Never overwrites a file.

## Load it unpacked

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and pick the `extension/` folder.
3. Right-click any image. Settings: the extension's **Details → Extension options**, or Chrome's Extensions (puzzle) menu → ⋮ → **Options**.

Needs Chrome 116 or newer.

## Save modes

| Mode | What happens |
|---|---|
| **Downloads folder** (default) | `chrome.downloads` into your downloads folder (plus subfolder). Chrome adds " (1)" if the name exists. |
| **A folder you choose** | Pick a folder once in Options. The offscreen document writes the file straight into it, creating subfolders and adding " (2)", " (3)"… instead of overwriting. If Chrome needs your OK again, a small window asks you to reconnect and then writes the file. |
| **Ask every time** | Chrome's Save As dialog for each image. |

If a site blocks cross-site image reads, a small window asks whether to allow that one site. **Allow and save** requests `https://that-site/*` and retries. **Save original format instead** downloads the file untouched. You can remove sites in Options → **Sites you've allowed**.

## Known limits

- **Folder reconnect after a restart.** Chrome forgets folder access when it restarts unless you chose **Allow on every visit**. Then the first save asks you to reconnect (one click). This can't be done silently: Chrome requires a click to grant folder access.
- **Page `blob:` images can't be saved.** Some sites draw images from `blob:` URLs that only exist inside the page. Reading them would need access to your pages, which Imgkeep doesn't have. The error window explains this.
- **Original format and Ask always use Downloads.** In folder mode, **Original format** still saves through Chrome's downloads (with your subfolder and name template). **Ask every time** uses Chrome's Save As dialog.
- **Original format without a file extension** in the URL is named by Chrome from the server's answer, without your subfolder or template.
- Very large images may exceed Chrome's canvas limit; you'll see "too large to convert".
- Animated GIF and WebP are saved as their first frame.

## Imgkeep Pro waitlist link

The Options page shows a **Get notified** link under "Imgkeep Pro — coming soon" only when `PRO_WAITLIST_URL` is set:

```js
// extension/lib/settings.js
export const PRO_WAITLIST_URL = "https://imgkeep.app/pro";
```

The static check only allows URLs on imgkeep.app and the Chrome Web Store, so host the waitlist page on imgkeep.app (or add its host to `ALLOWED_URL` in `tests/static-check.mjs` on purpose).

## Development

Requirements: Node.js 20 or newer. The extension needs nothing; Node is only for tests and store images.

```bash
npm install
npx playwright install chromium
npm test
```

`npm test` generates fixtures if missing, runs the static trust check (`tests/static-check.mjs`), then Playwright:

- `tests/extension.spec.mjs`: the real extension in Chromium against two local servers (one with CORS, one without). WebP→PNG, PNG→JPG (white corners), JPG→WebP, AVIF→PNG, SVG→PNG, Original format, subfolder and template, no overwrite, `data:` input, large files, the ask window (site access, error, folder), folder mode, and the options page. Outputs are decoded and checked for format, size and pixels.
- `tests/settings.spec.mjs`: file-name templating.
- `tests/site.spec.mjs`: the website has no console errors, no trackers, and `privacy.html` matches `PRIVACY.md`.

Other scripts:

| Command | What it does |
|---|---|
| `npm run check` | Static trust check only |
| `npm run icons` | Redraws `extension/icons/*.png` and the site icons (Python 3, standard library) |
| `npm run fixtures` | Regenerates test images (AVIF needs macOS `sips`; the file is checked in) |
| `npm run store` | Renders `store/*.png` from `store/scenes.html`, with real captures of the options page and ask window |
| `sh scripts/package.sh` | Runs the tests, then builds `dist/imgkeep-<version>.zip` |

## Repository layout

```
extension/   the extension (load unpacked; source of the store zip)
site/        imgkeep.app (GitHub Pages)
tests/       Playwright tests, fixtures, local servers, static check
store/       listing copy, scenes and rendered store images
scripts/     package.sh, make-icons.py
```

## Deployment

Nothing here has been run yet. Do these in order.

### 1. Git and GitHub

```bash
git init -b main
git add -A
git commit -m "Imgkeep 0.3.0"
gh repo create imgkeep --public --source=. --remote=origin --push
```

### 2. GitHub Pages from `site/`

The workflow `.github/workflows/pages.yml` publishes `site/` on every push to `main`.

```bash
gh api -X POST repos/<github-user>/imgkeep/pages -f build_type=workflow
gh workflow run "Deploy site"
gh api -X PUT repos/<github-user>/imgkeep/pages -f cname=imgkeep.app
```

With workflow deploys, GitHub uses the domain set in the repo settings (the `site/CNAME` file documents it). After DNS works and GitHub has issued the certificate (can take up to an hour):

```bash
gh api -X PUT repos/<github-user>/imgkeep/pages -F https_enforced=true
```

Or in the browser: repo **Settings → Pages**: Source **GitHub Actions**, Custom domain `imgkeep.app`, tick **Enforce HTTPS**.

### 3. GoDaddy DNS for imgkeep.app

In GoDaddy → **My Products → imgkeep.app → DNS**, remove any existing `@` A records (GoDaddy's parking page) and add:

| Type | Name | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | `<github-user>.github.io` |

Check with `dig +short imgkeep.app` and `dig +short www.imgkeep.app`.

### 4. Chrome Web Store

1. `sh scripts/package.sh` → `dist/imgkeep-0.3.0.zip`.
2. Sign in to the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/devconsole) with helloimgkeep@gmail.com. Account type: **Non-trader**.
3. **New item** → upload `dist/imgkeep-0.3.0.zip`.
4. **Store listing**: paste from `store/listing.md` (description, category Tools, language English). Upload `extension/icons/icon128.png`, the four `store/screenshot-*.png` files and `store/promo-tile-440x280.png`.
5. **Privacy practices**: single purpose, each permission justification, remote code "No", data usage "none", tick all three certifications (all in `store/listing.md`). Privacy policy URL `https://imgkeep.app/privacy.html` (must be live first, see steps 2–3).
6. **Distribution**: Public, all regions, free.
7. **Submit for review**.

### 5. After approval

1. In `site/index.html`, replace `href="#"` on the **Add to Chrome — free** button (marked `STORE_URL`) with the listing URL.
2. Commit and push; the Pages workflow redeploys.
