# Firefox Add-ons (AMO) listing: Imgkeep 0.15.2

The first Firefox version. Submitted by `node scripts/amo-publish.mjs` (AMO API, needs `~/.config/imgkeep/amo.env`), which reads the summary and description below; translations come from the release pipeline.
Differences from Chrome and Edge, reflected in the text: no "A folder you choose" (Firefox has no File System Access API), three install permissions (no offscreen), and the anonymous summary is opt-in (Firefox asks at install).

- **Name:** Save image as JPG or PNG, WebP converter (amoName in store/i18n/<lang>.json since 0.15.2; was "Save image as PNG, JPG, WebP, GIF or PDF — Imgkeep"). AMO shows "by Imgkeep" under it.
- **Add-on URL (slug):** imgkeep → https://addons.mozilla.org/firefox/addon/imgkeep/ (the rating link in the extension points here)
- **Categories:** Photos, Music & Videos (`photos-music-videos`) (AMO doesn't allow "Other" alongside another category)
- **Licence:** MIT
- **Homepage:** https://imgkeep.app · **Support:** https://imgkeep.app/support.html · **Privacy policy:** https://imgkeep.app/privacy.html
- **Firefox for Android:** not offered (no right-click menu there).

## Summary (≤250 characters)

```text
Convert WebP and AVIF images to JPG or PNG from the right-click menu, or save any image as PDF, GIF or a colour palette. Works on sites that block saving. No uploads, no account.
```

## Description

```text
Imgkeep is a free image converter for your right-click menu. Save any image as PNG, JPG, WebP, GIF or PDF, take its colour palette, convert WebP and AVIF, and save photos even on sites that hide them from the right-click.

Right-click an image → Imgkeep → choose your format. It's saved to your Downloads folder, or copy it as PNG and paste it into another app. Images are converted on your computer: no uploads, no account.

WORKS WHERE RIGHT-CLICK DOESN'T

On sites like Instagram and Pinterest, a layer over the photo stops the browser's own "Save image as" from reaching it. Right-click over the photo and choose "Imgkeep: Find image here": Imgkeep finds the image behind the layer, at its largest available size. If it isn't sure which image you meant, it shows you the images on screen to pick from.

Find image here is off until you turn it on, in Options or the first time you use it. It looks at the current page only when you ask, and never changes it.

SAVE WITH ONE KEY

• Press Alt+Shift+S to save the image under your pointer in the format you used last. No menu, and it works on sites that block the right-click.
• Or click Imgkeep's toolbar button to see the images on screen and pick the one to save.
• Both use the same setting as Find image here, and look at the page only at the moment you press or click. You can change the shortcut in Firefox's Manage Extension Shortcuts.

CONVERT WEBP AND AVIF TO PNG OR JPG

Many sites now use WebP and AVIF images, which other apps often can't open. Imgkeep saves them in a format that works wherever you need it.

• Standard image files: JPGs are saved as .jpg, not .jfif. SVG and data: images work too.
• Keep animations moving: animated WebP, AVIF and APNG become a GIF that keeps its timing and transparency. Animated GIFs are saved unchanged.
• Save as PDF: a one-page PDF sized to the image, transparency kept. Useful for receipts, documents and sharing.
• Copy as PNG: put the image on your clipboard as a real PNG, transparency kept, and paste it straight into a design or slide tool like Canva or Google Slides.
• Save as AVIF or APNG: in More options. AVIF files are often half the size of a JPG that looks the same; APNG keeps an animation in full colour with real transparency.
• Icons and bitmaps: in More options, save as ICO (16 to 256 px in one file, for desktop shortcuts and favicons) or BMP.
• Keep the original: save the image in its original format when you don't need a conversion.

TAKE THE COLOURS FROM ANY IMAGE

Right-click an image → Imgkeep → Get colour palette. See its main colours, largest first, and click one to copy it as HEX, RGB or HSL.

• Copy all at once as CSS variables, a Tailwind snippet, JSON or a plain list.
• Save the palette as a PNG swatch strip, a .gpl file for GIMP or an .ase file for Adobe apps.
• Works with Find image here, so you can take colours from photos on sites like Instagram and Pinterest that block the right-click.
• Worked out on your computer. The image and its colours never leave it.

RESIZE IMAGES AND CONTROL QUALITY

• Save the full-size version: many sites show a smaller copy of an image. Turn this on in Options and Imgkeep saves the full-size file instead, on sites like Pinterest, X, Etsy, Reddit, Unsplash, Wikipedia and shops or blogs on Shopify or WordPress. If it can't get it, you get the image you clicked. Off unless you turn it on.
• Resize automatically: set a maximum width in Options. Larger images scale down proportionally; smaller ones are never enlarged.
• Preview before saving: More options shows the result's size in pixels and kilobytes. Choose format, width, quality, background and file name for that image.
• Adjust quality: JPG, WebP and AVIF quality sliders, and a background colour for transparent images saved as JPG.

CHOOSE SUBFOLDERS AND FILE NAMES

• Save where you want: straight to your Downloads folder, or choose the place every time. Organise images into subfolders like Imgkeep/{site}.
• Custom file names: build names from {name}, {site}, {title}, {date}, {time}, {w}, {h} and a counting {n}, e.g. {name}-{w}x{h}.
• Never overwrites: if a file with the same name exists, the new one gets a number like " (1)".

LOCAL CONVERSION AND ACCESS YOU CONTROL

• No uploads: images are converted on your computer. No account.
• No background page reading: Imgkeep looks at a page only when you ask (Find image here, Alt+Shift+S or the toolbar button), and never changes a page.
• Three permissions only: contextMenus, downloads, storage. Others are optional and asked only when needed: activeTab and scripting if you turn on Find image here and the shortcut, and access to one site, if that site blocks an image and you allow it.
• One anonymous daily summary, only if you allow it when installing: usage counts and failures, like "12 saves as JPG, 1 failed", so we know what to improve. Never images, website addresses or file names. One click in Options turns it off.
• Open source under the MIT licence, with no build step: the code you read is the code that runs. The one compiled part, the AVIF encoder, is the open-source libavif, unchanged and checked by its fingerprint.
• Free, with no limits: no ads and no welcome tabs. It asks for a rating at most three times, and stops as soon as you rate it or say no. Every feature available today stays free, including colour palettes.

WHEN A SITE BLOCKS AN IMAGE

A few sites stop other sites from reading their images. Only then, and only after you click to allow it, Imgkeep asks your browser for access to that one site. If the site still refuses, Imgkeep can ask for the image the way your browser does, by telling the site which site you were on (never the page). You can remove access any time in Options. Or choose "Save original format instead".

Suggest features and vote on ideas: https://imgkeep.app/ideas.html
```

## Notes for reviewers

```text
Imgkeep adds a right-click menu on images ("Imgkeep" → PNG, JPG, WebP, GIF, PDF, Original format, Copy as PNG, Get colour palette, More options…). Everything is converted in the extension's background page (Firefox's MV3 background page has a DOM; the same code runs in an offscreen document on Chrome). Source: https://github.com/ybider-tech/imgkeep (MIT); the Firefox package is built by scripts/build-firefox.mjs from the extension/ folder, only the manifest differs. No build step, no minification.

One third-party compiled part: vendor/avif/avif_enc.js + avif_enc.wasm, the libavif 1.0.1 AVIF encoder from the npm package @jsquash/avif 2.1.1, unchanged (https://www.npmjs.com/package/@jsquash/avif, https://github.com/jamsinclair/jSquash). SHA-256: avif_enc.js c6805e62cae5c1b9870fcc0448437da9e4edfc58c3da264af52361281082c63c, avif_enc.wasm d9f2a95164362af48558d176e619becfd49dd97b50b86c679b47100860522b3d (pinned by tests/static-check.mjs). Loaded only when the user saves as AVIF; it fetches nothing.

Network: only the image the user right-clicked (offscreen.js) and, if the user allows "technical and interaction data", one anonymous daily summary of counts to PostHog EU (lib/telemetry.js, https://eu.i.posthog.com/i/v0/e/): no URLs, file names or identifiers. Optional permissions: activeTab + scripting for "Find image here" (off until turned on); per-site host access only after the user clicks "Allow and save" when a site blocks cross-origin image reads.

To test: right-click any image, choose Imgkeep → JPG; the file lands in Downloads. Get colour palette opens a small window with the image's main colours.
```
