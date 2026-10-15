# Chrome Web Store listing: Imgkeep 0.8.0

Live: https://chromewebstore.google.com/detail/fkclfgbmjaafglfifenonfcahfdmajbl

## Basics

- **Name** (from the manifest): Save image as PNG, JPG, WebP, GIF or PDF — Imgkeep
- **Tagline:** Right format. Right folder. Nothing else.
- **Summary** (≤132 chars, from the manifest): Right-click to save any image as PNG, JPG, WebP, GIF or PDF, even ones sites hide. Converted on your device. No personal data.
- **Category:** Tools
- **Language:** English (default), plus he, es, pt_BR, de, fr, ja, hi, ar: name and summary come from the package; descriptions are in [listing-translations.md](listing-translations.md)
- **Homepage:** https://imgkeep.app
- **Support URL:** https://imgkeep.app/support.html (email: helloimgkeep@gmail.com)
- **Privacy policy:** https://imgkeep.app/privacy.html

## Description

v9 (for 0.8.0, approved 2026-10-12): search-friendly headings (Works where right-click doesn't, Convert WebP and AVIF…), sites named only as examples ("on sites like Instagram and Pinterest", never "downloader"), Keep the original bullet, four permissions and one rating request kept. Edge: the same with "your browser's Downloads folder" (see edge-listing.md). Translations: listing-translations.md (browser-neutral, for both stores).

```text
Imgkeep is a free image converter for your right-click menu. Save any image as PNG, JPG, WebP, GIF or PDF, convert WebP and AVIF, and save photos even on sites that hide them from the right-click.

Right-click an image → Imgkeep: Save image as → choose your format. It's saved straight to your chosen folder, or copy it as PNG and paste it into another app. Images are converted on your computer: no uploads, no account.

WORKS WHERE RIGHT-CLICK DOESN'T

On sites like Instagram and Pinterest, a layer over the photo stops the browser's own "Save image as" from reaching it. Right-click over the photo and choose "Imgkeep: Find image here": Imgkeep finds the image behind the layer, at its largest available size. If it isn't sure which image you meant, it shows you the images on screen to pick from.

Find image here is off until you turn it on, in Options or the first time you use it. It looks at the current page only when you ask, and never changes it.

CONVERT WEBP AND AVIF TO PNG OR JPG

Get the format you need for editing, sharing and other apps: PNG, JPG, WebP, AVIF, GIF, PDF, ICO, BMP or the original format.

• Standard image files: JPGs are saved as .jpg, not .jfif. SVG and data: images work too.
• Keep animations moving: animated WebP, AVIF and APNG become a GIF that keeps its timing and transparency. Animated GIFs are saved unchanged.
• Save as PDF: a one-page PDF sized to the image, transparency kept. Useful for receipts, documents and sharing.
• Copy as PNG: put the image on your clipboard as a real PNG, transparency kept, ready to paste anywhere.
• Save as AVIF: in More options, files often half the size of a JPG that looks the same, transparency kept.
• Icons and bitmaps: in More options, save as ICO (16 to 256 px in one file, for desktop shortcuts and favicons) or BMP.
• Keep the original: save the image in its original format when you don't need a conversion.

RESIZE IMAGES AND CONTROL QUALITY

• Resize automatically: set a maximum width in Options. Larger images scale down proportionally; smaller ones are never enlarged.
• Preview before saving: More options shows the result's size in pixels and kilobytes. Choose format, width, quality, background and file name for that image.
• Adjust quality: JPG and WebP quality sliders, and a background colour for transparent images saved as JPG.

CHOOSE YOUR FOLDERS AND FILE NAMES

• Save to your folder: choose a folder once, use Chrome's Downloads folder, or ask every time. Organise images into subfolders like Imgkeep/{host}.
• Custom file names: build names from {name}, {host}, {date}, {time}, {w} and {h}, e.g. {name}-{w}x{h}.
• Never overwrites: if a file with the same name exists, the new one gets a number like " (1)".

LOCAL CONVERSION AND ACCESS YOU CONTROL

• No uploads: images are converted on your computer. No account.
• No background page reading: Imgkeep looks at a page only when you ask it to find an image there, and never changes a page.
• Four permissions only: contextMenus, downloads, storage, offscreen. Two more, activeTab and scripting, only if you turn on Find image here.
• One anonymous daily summary: usage counts and failures, like "12 saves as JPG, 1 failed", so we know what to improve. Never images, website addresses or file names. One click in Options turns it off.
• Open source under the MIT licence, with no build step: the code you read is the code that runs. The one compiled part, the AVIF encoder, is the open-source libavif, unchanged and checked by its fingerprint.
• Free, with no limits: no ads, no welcome tabs, and one request for a rating, ever. Every feature available today stays free.

WHEN A SITE BLOCKS AN IMAGE

A few sites stop other sites from reading their images. Only then, and only after you click to allow it, Imgkeep asks your browser for access to that one site. You can remove it any time in Options. Or choose "Save original format instead".

Suggest features and vote on ideas: https://imgkeep.app/ideas.html
```

## Privacy practices tab

### Single purpose

Save the image you right-click in the format and folder you choose.

### Permission justifications

- **contextMenus:** Adds the "Imgkeep: Save image as" entry (PNG, JPG, WebP, GIF, PDF, Original format, Copy as PNG, More options…) to the right-click menu on images, and an "Imgkeep: Find image here" item on sites that cover their images with another layer (only usable after the user turns that feature on). This menu is the only way to use the extension.
- **downloads:** Saves the converted image, or the original file, through Chrome's downloads, with the subfolder and file name the user set, and without overwriting existing files.
- **storage:** Stores the user's settings (save mode, subfolder, file-name template, quality, JPG background colour, maximum width) in Chrome sync storage, keeps a pending save in session storage while one of the extension's small windows is open, and keeps in local storage the last format and width used in More options plus a count of successful and failed saves (to time a single rating request and label new menu items), and today's anonymous usage counts until they are sent as the one daily summary described under Data usage (turned off in Options, they are deleted). Nothing else in storage is sent anywhere.
- **offscreen:** Creates an offscreen document to decode the image and re-encode it with a canvas on the user's computer, and to write the file into the folder the user chose. Service workers have no DOM or canvas for this.
- **activeTab (optional, off until the user turns it on):** Only for "Imgkeep: Find image here", a menu item shown on sites that cover their images with another layer (Instagram, Pinterest, Facebook, X…), where the right-click can't reach the image. When the user clicks it, activeTab gives access to that one tab at that moment, to find the image under the click. The user turns it on in Options or the first time they use it.
- **scripting (optional, off until the user turns it on):** Runs a small, packaged function once in that tab (with the activeTab access above) that reads the addresses of the images on screen and returns them. It never changes the page, and nothing from the page is kept or sent anywhere.
- **Optional host access (http://\*/\*, https://\*/\*):** Not granted at install. Some sites block cross-site reads of their images, so the conversion fails. Only then, and only after the user clicks "Allow and save", Imgkeep requests access to that one site (for example https://example.com/\*), to fetch the image the user right-clicked. Each site can be removed in Options. No content scripts are used and no page content is read.

### Remote code

No, I am not using remote code. All code is packaged in the extension. There are no external scripts, fonts, eval or dynamically loaded code.

### Data usage

What user data do you plan to collect from users now or in the future? Since 0.7.0: **User activity** only (tick it; leave every other category unticked).

Why: 0.7.0 sends one anonymous daily summary of feature use (counts of saves per format and mode, failures by error type, copies, More options, site-access and rating answers, version, browser, language) to PostHog (EU cloud; Aptabase until 0.8.1). No images, URLs, site or file names, or identifiers. Since 0.9.0 no location at all: the PostHog project discards IP addresses and each event turns off location lookup. If the form's "Location" definition (region, IP address) seems to cover a country derived by the analytics service, tick Location too: over-disclosing is safe, under-disclosing is not.

Justification text, if asked: "Anonymous daily counts of which features were used and which saves failed (for example: 12 saves as JPG, 1 failed), sent to PostHog (EU) to decide what to improve. No personal data, URLs or file names. On by default, one click off in Options."

Certifications (tick all three):

- [x] I do not sell or transfer user data to third parties, outside of the approved use cases.
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose. (The counts are used only to improve saving images, which is the single purpose.)
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes.

## Distribution

- Visibility: Public
- Regions: All regions
- Trader status: Non-trader
- Pricing: Free

## Images

| File | Size | Use |
|---|---|---|
| `extension/icons/icon128.png` | 128×128 | Store icon |
| `store/screenshot-1-menu.png` | 1280×800 | Screenshot 1: the right-click menu over a product page |
| `store/screenshot-2-options.png` | 1280×800 | Screenshot 2: the options page |
| `store/screenshot-3-trust.png` | 1280×800 | Screenshot 3: the trust list |
| `store/screenshot-4-site-access.png` | 1280×800 | Not on the Chrome Web Store since 0.8.0 (the store allows 5 screenshots; this rare case is covered in the description). Edge keeps it (up to 10). |
| `store/screenshot-5-gif.png` | 1280×800 | Screenshot 5: GIF keeps animation |
| `store/screenshot-6-find.png` | 1280×800 | Screenshot 6 (new in 0.8.0): Find image here on a photo feed. Drag it to second place, right after the menu: it's the differentiator. Chrome order (Yaron 2026-10-12): menu, find, GIF, options, trust (features first, trust last). Uses a made-up site, not Instagram's interface (trademarks). |
| `store/promo-tile-440x280.png` | 440×280 | Small promo tile |
| `store/marquee-1400x560.png` | 1400×560 | Marquee promo tile (needed to be eligible for the homepage carousel) |
| Promo video (YouTube link field) | https://youtu.be/QZfq5xLYdmo | Demo video, 28 s. Add after the marquee tile's review is done. |

Regenerate them with `npm run store` (renders `store/scenes.html` with Playwright).
