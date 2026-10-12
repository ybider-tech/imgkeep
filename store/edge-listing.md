# Microsoft Edge Add-ons listing: Imgkeep 0.8.0

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
- **Short description** (if asked): Right-click to save any image as PNG, JPG, WebP, GIF or PDF, even ones sites hide. Converted on your device. No personal data.
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
Imgkeep is a free image converter for your right-click menu. Save any image as PNG, JPG, WebP, GIF or PDF, convert WebP and AVIF, and save photos even on sites that hide them from the right-click.

Right-click an image → Imgkeep: Save image as → choose your format. It's saved straight to your chosen folder, or copy it as PNG and paste it into another app. Images are converted on your computer: no uploads, no account.

WORKS WHERE RIGHT-CLICK DOESN'T

On sites like Instagram and Pinterest, a layer over the photo stops the browser's own "Save image as" from reaching it. Right-click over the photo and choose "Imgkeep: Find image here": Imgkeep finds the image behind the layer, at its largest available size. If it isn't sure which image you meant, it shows you the images on screen to pick from.

Find image here is off until you turn it on, in Options or the first time you use it. It looks at the current page only when you ask, and never changes it.

CONVERT WEBP AND AVIF TO PNG OR JPG

Get the format you need for editing, sharing and other apps: PNG, JPG, WebP, GIF, PDF or the original format.

• Standard image files: JPGs are saved as .jpg, not .jfif. SVG and data: images work too.
• Keep animations moving: animated WebP, AVIF and APNG become a GIF that keeps its timing and transparency. Animated GIFs are saved unchanged.
• Save as PDF: a one-page PDF sized to the image, transparency kept. Useful for receipts, documents and sharing.
• Copy as PNG: put the image on your clipboard as a real PNG, transparency kept, ready to paste anywhere.
• Keep the original: save the image in its original format when you don't need a conversion.

RESIZE IMAGES AND CONTROL QUALITY

• Resize automatically: set a maximum width in Options. Larger images scale down proportionally; smaller ones are never enlarged.
• Preview before saving: More options shows the result's size in pixels and kilobytes. Choose format, width, quality, background and file name for that image.
• Adjust quality: JPG and WebP quality sliders, and a background colour for transparent images saved as JPG.

CHOOSE YOUR FOLDERS AND FILE NAMES

• Save to your folder: choose a folder once, use your browser's Downloads folder, or ask every time. Organise images into subfolders like Imgkeep/{host}.
• Custom file names: build names from {name}, {host}, {date}, {time}, {w} and {h}, e.g. {name}-{w}x{h}.
• Never overwrites: if a file with the same name exists, the new one gets a number like " (1)".

LOCAL CONVERSION AND ACCESS YOU CONTROL

• No uploads: images are converted on your computer. No account.
• No background page reading: Imgkeep looks at a page only when you ask it to find an image there, and never changes a page.
• Four permissions only: contextMenus, downloads, storage, offscreen. Two more, activeTab and scripting, only if you turn on Find image here.
• One anonymous daily summary: usage counts and failures, like "12 saves as JPG, 1 failed", so we know what to improve. Never images, website addresses or file names. One click in Options turns it off.
• Open source under the MIT licence, with no build step, so the code you read is the code that runs.
• Free, with no limits: no ads, no welcome tabs, and one request for a rating, ever. Every feature available today stays free.

WHEN A SITE BLOCKS AN IMAGE

A few sites stop other sites from reading their images. Only then, and only after you click to allow it, Imgkeep asks your browser for access to that one site. You can remove it any time in Options. Or choose "Save original format instead".

Suggest features and vote on ideas: https://imgkeep.app/ideas.html
```

## Notes for certification
```text
Imgkeep adds a right-click menu on images ("Imgkeep: Save image as" → PNG, JPG, WebP, GIF, PDF, Original format, Copy as PNG, More options…). To test: right-click any image on any website and pick a format; the file is saved to Downloads. "Copy as PNG" opens a small window that copies the image to the clipboard and closes itself. "More options…" opens a window with a preview, where you can pick format, maximum width, quality and file name before saving.

Permissions: contextMenus (the menu), downloads (saving files), storage (settings), offscreen (a hidden page with a canvas to convert the image locally). Optional host access is requested for one site at a time, only when that site blocks cross-site image reads and only after the user clicks "Allow and save". No content scripts, no remote code. One anonymous daily summary of feature use (counts only, no URLs or file names) is sent to Aptabase (eu.aptabase.com); it can be turned off in Options. Source code: https://github.com/ybider-tech/imgkeep

New in 0.6.1: the extension name now starts with what it does ("Save image as PNG, JPG, WebP, GIF or PDF — Imgkeep"). Menu items added since a user's previous version show "✨ New" for 30 days after an update. After at least 15 successful saves over 7 days, Imgkeep asks once for a rating (in its own window after a copy or save, and as a menu item for up to 14 days); "No thanks" ends it for good. No incentives. These counts stay in the extension's local storage and are never sent anywhere. Options has "What's new" and "Rate Imgkeep" links.

New in 0.7.0: an anonymous daily usage summary, on by default and switched off with one click in Options ("Anonymous usage counts", which also shows exactly what was counted and sent). Once a day the extension sends one event to Aptabase (https://eu.aptabase.com/api/v0/event, an open-source analytics service hosted in the EU) with the previous day's totals: saves per format and save mode, failures by error type, copies, and similar counts, plus version, browser and language. It never contains image or page URLs, site or file names, or any identifier; each summary has a new random session id. This was announced on imgkeep.app and in the privacy policy before this version. The code is in extension/lib/telemetry.js (one fetch, to that one address). Also new: the format used last appears at the top of the right-click submenu, e.g. "JPG (last used)".

New in 0.8.0: "Imgkeep: Find image here", a right-click item shown only on sites that cover their images with another layer (Instagram, Pinterest, Facebook, X, Tumblr, Flickr, Threads). It uses two OPTIONAL permissions, activeTab and scripting, which stay off until the user turns them on (in Options or the first time they use it). When clicked, it runs a packaged function once in that tab that reads the addresses of the images on screen, then opens the chosen one in the extension's own window to save. It never changes the page. To test: turn it on in Options → "Images that sites cover", open an Instagram profile, right-click a photo, choose "Imgkeep: Find image here".

New in 0.7.1: after an uninstall, the browser opens a short, optional Google Form asking why (chrome.runtime.setUninstallURL). Only the extension version is in the form's address; the form collects no email addresses. No new permission.

The same package is live on the Chrome Web Store: https://chromewebstore.google.com/detail/fkclfgbmjaafglfifenonfcahfdmajbl
```
