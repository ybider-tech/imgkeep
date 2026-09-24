# Changelog

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
