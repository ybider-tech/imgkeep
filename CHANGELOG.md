# Changelog

## 0.6.0 — unreleased

- **Copy as PNG.** New menu item: the image goes on the clipboard as a real PNG, transparency kept, ready to paste. "Copied" shows only after the clipboard accepted it. If it refuses, your clipboard is left as it was and you can save the PNG instead. No new permission: the copy happens in Imgkeep's own small window, which has focus.
- **Maximum width.** New setting in Options → Quality and size: wider images are scaled down to fit, keeping their shape; smaller ones are never enlarged. Applies to PNG, JPG, WebP, PDF, GIF and Copy as PNG; Original format is never changed.
- **More options…** New menu item: a window with a live preview of the result, its real size in pixels and kilobytes, and controls for format (PNG, JPG, WebP), maximum width, quality, JPG background and file name. Save, or Copy as PNG.
- **Checked output.** Every converted file's first bytes are checked against the format you chose, and its extension comes from those bytes. A browser that can't make a format gives a clear error instead of a mislabelled file. Empty answers from a server never become files.
- **Clearer errors.** The error window offers **Try again** where that can help, and **Open image** to see the source in a tab.
- **One pipeline.** Quick saves, More options and Copy as PNG use the same code to fetch, decode, resize, encode and check (`extension/lib/image.js`). A fetched image is reused while its window is open and dropped as soon as the save, copy or window is done.
- Windows can only ask about their own job: messages are checked, carry a job id rather than a URL, and only the image you right-clicked is ever fetched.
- Imgkeep Pro waitlist: Options → Imgkeep Pro → **Get notified** opens imgkeep.app/pro.html. Pro is planned to add presets, file-size targets, rules per site and a log. The size-target code is already in the pipeline and tested, but not shown until then.
- Tests also run on Windows in CI.

## 0.5.0 — 2026-10-04

- **Save as PDF.** New menu item "PDF": a one-page PDF exactly the size of the image. Photos are stored as JPEG (using the JPG quality setting); images with transparency are stored losslessly and stay transparent. Written by a small built-in PDF writer (`extension/lib/pdf.js`): no library, no new permissions, converted locally.
- **New icon:** a picture frame with a download arrow. 48 and 128 px from the designer's pack (`store/icon-pack/`); 16 and 32 px simplified so they stay readable in the right-click menu and toolbar.
- New store name: "Imgkeep — Save image as PNG, JPG, WebP, GIF or PDF" (cleaner, no repeated keywords), and the summary mentions PDF.
- **Nine languages.** The menu, options page and small windows follow your browser's language: English, Arabic, French, German, Hebrew, Hindi, Japanese, Portuguese (Brazil) and Spanish. Arabic and Hebrew read right to left. Store name and summary are translated too (`extension/_locales/`); translated store descriptions are in `store/listing-translations.md`.
- The static check now verifies every translation: same messages as English, placeholders, `{tokens}` and markup kept, store length limits respected, and no unused or missing messages.

## 0.4.0 — 2026-09-27

- **Save as GIF, keeping animation.** New menu item "GIF (keeps animation)". Animated GIFs are saved byte for byte; animated WebP, AVIF and APNG are converted frame by frame with their timing and transparency; still images become one-frame GIFs. GIFs are at most 800px wide. Converted locally, like everything else.
- Limits for GIF output (600 frames, ~150M source pixels, 90 s), with clear "too large" and "took too long" messages.
- Vendored gifenc 1.0.3 (MIT) as `extension/lib/gifenc.js`. No new permissions and no new network requests.
- New store name and summary: "Imgkeep — Save image as PNG, JPG, WebP, GIF. WebP & AVIF converter".
- Messages say "your browser" instead of "Chrome", ready for Microsoft Edge.

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
