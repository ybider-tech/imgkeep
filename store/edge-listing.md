# Microsoft Edge Add-ons listing: Imgkeep 0.5.0

Live: https://microsoftedge.microsoft.com/addons/detail/kokbmagcbobpjclpidebikeklmpafhhd (approved 2026-09-29, category Photos)

Same package as the Chrome Web Store (`dist/imgkeep-0.4.0.zip`). Submit through Microsoft Partner Center: https://partner.microsoft.com/dashboard/microsoftedge/overview

## Properties
- **Category:** Photos (if it isn't offered, Productivity)
- **Privacy policy required?** Yes. URL: https://imgkeep.app/privacy.html
- **Website URL:** https://imgkeep.app
- **Support contact:** https://imgkeep.app/support.html (email helloimgkeep@gmail.com)
- **Mature content:** No

## Store listing (English)
- **Display name:** comes from the manifest: Save image as PNG, JPG, WebP, GIF or PDF — Imgkeep
- **Short description** (if asked): Right-click to save any image as PNG, JPG, WebP, GIF or PDF. Converts WebP and AVIF on your device. No personal data.
- **Store logo (300×300):** `store/edge-logo-300.png`
- **Small promotional tile (440×280):** `store/promo-tile-440x280.png`
- **Screenshots (1280×800):** `store/screenshot-1-menu.png`, `store/screenshot-2-options.png`, `store/screenshot-3-trust.png`, `store/screenshot-4-site-access.png`
- **YouTube video URL:** https://youtu.be/QZfq5xLYdmo (add now as a listing update)
- **Search terms** (7 max, ≤30 characters each, ≤21 words in total; these are 21):
  1. save image as png
  2. save image as jpg
  3. webp to jpg
  4. webp to png
  5. webp to gif
  6. avif to jpg
  7. converter

### Description
```text
Right-click any image and save it as PNG, JPG, WebP, GIF or PDF, or copy it as PNG. Imgkeep converts it on your computer and saves it where you want, every time.

Many sites now serve WebP and AVIF images that other apps won't open. Imgkeep turns them into files that open everywhere, in one right-click:

Imgkeep: Save image as → PNG · JPG · WebP · GIF (keeps animation) · PDF · Original format · Copy as PNG · More options…

WHAT IT DOES

• Files that open anywhere: standard JPG or PNG, and JPGs are saved as .jpg, not .jfif. SVG and data: images work too.
• Keep the animation: animated WebP, AVIF and APNG become a GIF that keeps moving, with its timing and transparency. Animated GIFs are saved exactly as they are.
• Save as PDF: a one-page PDF exactly the size of the image, for receipts, documents and sharing. Transparency is kept.
• Copy as PNG: put the image on your clipboard as a real PNG, transparency kept, and paste it anywhere.
• Resize: set a maximum width in Options and bigger images are scaled down to fit, keeping their shape. Smaller ones are never enlarged.
• More options: preview the result with its real size in pixels and kilobytes, then pick format, width, quality, background and file name for just this image.
• Saves to your folder: choose a folder once and every image goes there, or use Edge's Downloads, or ask every time. Add subfolders like Imgkeep/{host}.
• Your file names: build names from {name}, {host}, {date}, {time}, {w} and {h}, e.g. {name}-{w}x{h}.
• Quality you control: JPG and WebP quality sliders, and the background colour for transparent images saved as JPG.
• Never overwrites: if a file with the same name already exists, the new one gets a number like " (1)" instead of replacing it.

BUILT TO BE TRUSTED

• No access to your pages: Imgkeep can't read or change the sites you visit. It sees only the image you right-click.
• Your images never leave your computer: they're converted on your device. No uploads, no account. The only thing Imgkeep sends is one anonymous daily summary, like "12 saves as JPG, 1 failed", so we know what to improve. Never addresses or file names. One click in Options turns it off.
• Four permissions only: contextMenus, downloads, storage, offscreen.
• Open source under the MIT licence, with no build step, so what you read is what runs.
• Free, with no limits: no ads, no welcome tabs. Imgkeep opens a small window only when you ask for one (Copy as PNG, More options) or when a save needs your OK, and asks for a rating just once, after you've used it for a while.

WHEN A SITE BLOCKS AN IMAGE

A few sites stop other sites from reading their images. Only then, and only after you click to allow it, Imgkeep asks your browser for access to that one site. You can remove it any time in Options. Or choose "Save original format instead".

Every feature in Imgkeep today stays free. Ideas and votes: imgkeep.app/ideas.html
```

## Notes for certification
```text
Imgkeep adds a right-click menu on images ("Imgkeep: Save image as" → PNG, JPG, WebP, GIF, PDF, Original format, Copy as PNG, More options…). To test: right-click any image on any website and pick a format; the file is saved to Downloads. "Copy as PNG" opens a small window that copies the image to the clipboard and closes itself. "More options…" opens a window with a preview, where you can pick format, maximum width, quality and file name before saving.

Permissions: contextMenus (the menu), downloads (saving files), storage (settings), offscreen (a hidden page with a canvas to convert the image locally). Optional host access is requested for one site at a time, only when that site blocks cross-site image reads and only after the user clicks "Allow and save". No content scripts, no remote code. One anonymous daily summary of feature use (counts only, no URLs or file names) is sent to Aptabase (eu.aptabase.com); it can be turned off in Options. Source code: https://github.com/ybider-tech/imgkeep

New in 0.6.1: the extension name now starts with what it does ("Save image as PNG, JPG, WebP, GIF or PDF — Imgkeep"). Menu items added since a user's previous version show "✨ New" for 30 days after an update. After at least 15 successful saves over 7 days, Imgkeep asks once for a rating (in its own window after a copy or save, and as a menu item for up to 14 days); "No thanks" ends it for good. No incentives. These counts stay in the extension's local storage and are never sent anywhere. Options has "What's new" and "Rate Imgkeep" links.

New in 0.7.0: an anonymous daily usage summary, on by default and switched off with one click in Options ("Anonymous usage counts", which also shows exactly what was counted and sent). Once a day the extension sends one event to Aptabase (https://eu.aptabase.com/api/v0/event, an open-source analytics service hosted in the EU) with the previous day's totals: saves per format and save mode, failures by error type, copies, and similar counts, plus version, browser and language. It never contains image or page URLs, site or file names, or any identifier; each summary has a new random session id. This was announced on imgkeep.app and in the privacy policy before this version. The code is in extension/lib/telemetry.js (one fetch, to that one address). Also new: the format used last appears at the top of the right-click submenu, e.g. "JPG (last used)".

The same package is live on the Chrome Web Store: https://chromewebstore.google.com/detail/fkclfgbmjaafglfifenonfcahfdmajbl
```
