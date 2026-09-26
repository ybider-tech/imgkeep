# Microsoft Edge Add-ons listing: Imgkeep 0.3.0

Same package as the Chrome Web Store (`dist/imgkeep-0.3.0.zip`). Submit through Microsoft Partner Center: https://partner.microsoft.com/dashboard/microsoftedge/overview

## Properties
- **Category:** Photos (if it isn't offered, Productivity)
- **Privacy policy required?** Yes. URL: https://imgkeep.app/privacy.html
- **Website URL:** https://imgkeep.app
- **Support contact:** https://imgkeep.app/support.html (email helloimgkeep@gmail.com)
- **Mature content:** No

## Store listing (English)
- **Display name:** comes from the manifest: Imgkeep — Save image as PNG, JPG, WebP
- **Short description** (if asked): Right-click any image to save it as PNG, JPG or WebP, straight to your folder. No site access, no tracking, open source.
- **Store logo (300×300):** `store/edge-logo-300.png`
- **Small promotional tile (440×280):** `store/promo-tile-440x280.png`
- **Screenshots (1280×800):** `store/screenshot-1-menu.png`, `store/screenshot-2-options.png`, `store/screenshot-3-trust.png`, `store/screenshot-4-site-access.png`
- **Search terms** (7 max, ≤30 characters each, ≤21 words in total; these are 21):
  1. save image as png
  2. save image as jpg
  3. webp to jpg
  4. webp to png
  5. avif to jpg
  6. image converter
  7. save webp

### Description
```text
Right-click any image and save it as PNG, JPG or WebP. Imgkeep converts it on your computer and saves it where you want, every time.

Sites now serve WebP and AVIF images that many apps won't open. Imgkeep saves WebP as JPG or PNG, and AVIF as JPG or PNG, in one right-click:

Imgkeep: Save image as → PNG · JPG · WebP · Original format

WHAT IT DOES

• Save WebP and AVIF as JPG or PNG: files every app opens. JPGs are saved as .jpg, not .jfif. SVG, GIF (first frame) and data: images work too.
• Saves to your folder: choose a folder once and every image goes there, or use Edge's Downloads, or ask every time. Add subfolders like Imgkeep/{host}.
• Your file names: build names from {name}, {host}, {date}, {time}, {w} and {h}, e.g. {name}-{w}x{h}.
• Quality you control: JPG and WebP quality sliders, and the background colour for transparent images saved as JPG.
• Never overwrites: if a file already exists, Imgkeep adds " (2)" instead of replacing it.

BUILT TO BE TRUSTED

• No access to your pages: Imgkeep can't read or change the sites you visit. It sees only the image you right-click.
• Nothing leaves your computer: images are converted on your device. No uploads, no analytics, no account.
• Four permissions only: contextMenus, downloads, storage, offscreen.
• Open source under the MIT licence, with no build step, so what you read is what runs.
• Free, with no limits: no ads, no review requests, no welcome tabs. A small window opens only when a save needs your OK.

WHEN A SITE BLOCKS AN IMAGE

A few sites stop other sites from reading their images. Only then, and only when you click "Allow and save", Imgkeep asks your browser for access to that one site. You can remove it any time in Options. Or choose "Save original format instead".

Every feature in Imgkeep today stays free. Ideas and votes: imgkeep.app/ideas.html
```

## Notes for certification
```text
Imgkeep adds a right-click menu on images ("Imgkeep: Save image as" → PNG, JPG, WebP, Original format). To test: right-click any image on any website and pick a format; the file is saved to Downloads.

Permissions: contextMenus (the menu), downloads (saving files), storage (settings), offscreen (a hidden page with a canvas to convert the image locally). Optional host access is requested for one site at a time, only when that site blocks cross-site image reads and only after the user clicks "Allow and save". No content scripts, no remote code, no data collection. Source code: https://github.com/ybider-tech/imgkeep

The same package is live on the Chrome Web Store: https://chromewebstore.google.com/detail/fkclfgbmjaafglfifenonfcahfdmajbl
```

## Known wording issue
A few messages inside the extension say "Chrome" (e.g. "Saves to Chrome's download folder"). They'll become browser-neutral in the next version, together with the planned name and summary update.
