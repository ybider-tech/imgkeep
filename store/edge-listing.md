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
- **Display name:** comes from the manifest: Imgkeep — Save image as PNG, JPG, WebP, GIF or PDF
- **Short description** (if asked): Right-click to save any image as PNG, JPG, WebP, GIF or PDF. Converts WebP and AVIF on your device, into your folder. No tracking.
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
Right-click any image and save it as PNG, JPG, WebP, GIF or PDF. Imgkeep converts it on your computer and saves it where you want, every time.

Many sites now serve WebP and AVIF images that other apps won't open. Imgkeep turns them into files that open everywhere, in one right-click:

Imgkeep: Save image as → PNG · JPG · WebP · GIF (keeps animation) · PDF · Original format

WHAT IT DOES

• Files that open anywhere: standard JPG or PNG, and JPGs are saved as .jpg, not .jfif. SVG and data: images work too.
• Keep the animation: animated WebP, AVIF and APNG become a GIF that keeps moving, with its timing and transparency. Animated GIFs are saved exactly as they are.
• Save as PDF: a one-page PDF exactly the size of the image, for receipts, documents and sharing. Transparency is kept.
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
Imgkeep adds a right-click menu on images ("Imgkeep: Save image as" → PNG, JPG, WebP, GIF, Original format). To test: right-click any image on any website and pick a format; the file is saved to Downloads.

Permissions: contextMenus (the menu), downloads (saving files), storage (settings), offscreen (a hidden page with a canvas to convert the image locally). Optional host access is requested for one site at a time, only when that site blocks cross-site image reads and only after the user clicks "Allow and save". No content scripts, no remote code, no data collection. Source code: https://github.com/ybider-tech/imgkeep

The same package is live on the Chrome Web Store: https://chromewebstore.google.com/detail/fkclfgbmjaafglfifenonfcahfdmajbl
```
