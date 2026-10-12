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

v8 (for 0.8.0): leads with Find image here ("Works where right-click doesn't"), a distinct opening paragraph, features grouped under Formats / Size and quality / Folders and names, trust bullets updated for the optional permissions. Paste as-is into the dashboard together with the 0.8.0 package. (v7, for 0.6.1, is in git history.)

```text
Imgkeep is a free, open-source browser extension. It adds one entry to your right-click menu: pick a format, and the image is converted on your computer and saved straight to your folder. Or copy it as PNG and paste it anywhere.

Works where right-click doesn't: on sites like Instagram and Pinterest, photos sit under another layer, so a right-click can't reach them. Choose Imgkeep: Find image here, and Imgkeep finds the photo for you, at its largest size. Off until you turn it on.

Many sites now serve WebP and AVIF images that other apps won't open. Imgkeep turns them into files that open everywhere, in one right-click:

Imgkeep: Save image as → PNG · JPG · WebP · GIF (keeps animation) · PDF · Original format · Copy as PNG · More options…

FORMATS

• Files that open anywhere: standard JPG or PNG, and JPGs are saved as .jpg, not .jfif. SVG and data: images work too.
• Keep the animation: animated WebP, AVIF and APNG become a GIF that keeps moving, with its timing and transparency. Animated GIFs are saved exactly as they are.
• Save as PDF: a one-page PDF exactly the size of the image, for receipts, documents and sharing. Transparency is kept.
• Copy as PNG: put the image on your clipboard as a real PNG, transparency kept, and paste it anywhere.

SIZE AND QUALITY

• Resize: set a maximum width in Options and bigger images are scaled down to fit, keeping their shape. Smaller ones are never enlarged.
• More options: preview the result with its real size in pixels and kilobytes, then pick format, width, quality, background and file name for just this image.
• Quality you control: JPG and WebP quality sliders, and the background colour for transparent images saved as JPG.

FOLDERS AND NAMES

• Saves to your folder: choose a folder once and every image goes there, or use Chrome's Downloads, or ask every time. Add subfolders like Imgkeep/{host}.
• Your file names: build names from {name}, {host}, {date}, {time}, {w} and {h}, e.g. {name}-{w}x{h}.
• Never overwrites: if a file with the same name already exists, the new one gets a number like " (1)" instead of replacing it.

BUILT TO BE TRUSTED

• Stays out of your pages: Imgkeep doesn't read the sites you visit, with one exception you control: when you ask it to find a hidden image, it looks at that page, just once, at that moment. It never changes a page. Off until you turn it on.
• Your images never leave your computer: they're converted on your device. No uploads, no account. The only thing Imgkeep sends is one anonymous daily summary, like "12 saves as JPG, 1 failed", so we know what to improve. Never addresses or file names. One click in Options turns it off.
• Four permissions only: contextMenus, downloads, storage, offscreen. Two more, activeTab and scripting, only if you turn on Find image here.
• Open source under the MIT licence, with no build step, so what you read is what runs.
• Free, with no limits: no ads, no welcome tabs. Imgkeep opens a small window only when you ask for one (Copy as PNG, More options) or when a save needs your OK, and asks for a rating just once, after you've used it for a while.

WHEN A SITE BLOCKS AN IMAGE

A few sites stop other sites from reading their images. Only then, and only after you click to allow it, Imgkeep asks your browser for access to that one site. You can remove it any time in Options. Or choose "Save original format instead".

Every feature in Imgkeep today stays free. Ideas and votes: imgkeep.app/ideas.html
```

## Privacy practices tab

### Single purpose

Save the image you right-click in the format and folder you choose.

### Permission justifications

- **contextMenus:** Adds the "Imgkeep: Save image as" entry (PNG, JPG, WebP, GIF, PDF, Original format, Copy as PNG, More options…) to the right-click menu on images. This menu is the only way to use the extension.
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

Why: 0.7.0 sends one anonymous daily summary of feature use (counts of saves per format and mode, failures by error type, copies, More options, site-access and rating answers, version, browser, language) to Aptabase. No images, URLs, site or file names, or identifiers. Aptabase derives the country from the request's IP address and doesn't store the IP. If the form's "Location" definition (region, IP address) seems to cover a country derived by the analytics service, tick Location too: over-disclosing is safe, under-disclosing is not.

Justification text, if asked: "Anonymous daily counts of which features were used and which saves failed (for example: 12 saves as JPG, 1 failed), sent to Aptabase (EU) to decide what to improve. No personal data, URLs or file names. On by default, one click off in Options."

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
| `store/screenshot-4-site-access.png` | 1280×800 | Screenshot 4: the site-permission window |
| `store/screenshot-5-gif.png` | 1280×800 | Screenshot 5: GIF keeps animation |
| `store/screenshot-6-find.png` | 1280×800 | Screenshot 6 (new in 0.8.0): Find image here on a photo feed. Drag it to second place, right after the menu: it's the differentiator. Uses a made-up site, not Instagram's interface (trademarks). |
| `store/promo-tile-440x280.png` | 440×280 | Small promo tile |
| `store/marquee-1400x560.png` | 1400×560 | Marquee promo tile (needed to be eligible for the homepage carousel) |
| Promo video (YouTube link field) | https://youtu.be/QZfq5xLYdmo | Demo video, 28 s. Add after the marquee tile's review is done. |

Regenerate them with `npm run store` (renders `store/scenes.html` with Playwright).
