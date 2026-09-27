# Changelog

## Unreleased

- **Save as GIF, keeping animation.** New menu item "GIF (keeps animation)". Animated GIFs are saved byte for byte; animated WebP, AVIF and APNG are converted frame by frame with their timing and transparency; still images become one-frame GIFs. GIFs are at most 800px wide. Converted locally, like everything else.
- Limits for GIF output (600 frames, ~150M source pixels, 90 s), with clear "too large" and "took too long" messages.
- Vendored gifenc 1.0.3 (MIT) as `extension/lib/gifenc.js`. No new permissions and no new network requests.

## 0.3.0 — 2026-09-24

First public release.

- Right-click menu on images: Imgkeep: Save image as → PNG, JPG, WebP, Original format.
- Converts on your computer in an offscreen document. Reads WebP, AVIF, SVG, PNG, JPG, GIF (first frame) and `data:` images.
- Three save modes: Downloads (default), a folder you choose, or ask every time.
- Subfolder and file-name templates with `{name}`, `{host}`, `{date}`, `{time}`, `{w}`, `{h}`.
- JPG and WebP quality, and a background colour for JPG.
- Never overwrites: existing names get " (2)", " (3)"… (folder mode) or Chrome's own numbering (Downloads).
- Per-site access only when a site blocks an image, only after you click, removable in Options.
- Permissions: `contextMenus`, `downloads`, `storage`, `offscreen`. No host access at install, no content scripts.
