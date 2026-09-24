# Chrome Web Store listing: Imgkeep 0.3.0

## Basics

- **Name:** Imgkeep — Save image as PNG, JPG, WebP
- **Tagline:** Right format. Right folder. Nothing else.
- **Summary (≤132 chars, from the manifest):** Right-click any image to save it as PNG, JPG or WebP, straight to your folder. No site access, no tracking, open source.
- **Category:** Tools
- **Language:** English
- **Homepage:** https://imgkeep.app
- **Support:** helloimgkeep@gmail.com
- **Privacy policy:** https://imgkeep.app/privacy.html

## Description

Right-click any image and save it as PNG, JPG or WebP. Imgkeep converts it on your computer and puts it where you want, every time.

Sites increasingly serve WebP and AVIF files that other apps won't open. Imgkeep adds one menu to Chrome's right-click menu:

Imgkeep: Save image as → PNG · JPG · WebP · Original format

WHAT IT DOES

• Remembers your folder: save to Chrome's Downloads, a folder you pick once, or ask every time. Add subfolders like Imgkeep/{host}.
• Handles WebP and AVIF: convert them to PNG or JPG that every app opens. SVG, GIF (first frame) and data: images work too.
• Your file names: build names from {name}, {host}, {date}, {time}, {w} and {h}, e.g. {name}-{w}x{h}.
• Quality you control: JPG and WebP quality sliders, and the background colour for transparent images saved as JPG.
• Never overwrites: if a file already exists, Imgkeep adds " (2)" instead of replacing it.

BUILT TO BE TRUSTED

• No access to your pages: Imgkeep can't read or change the sites you visit. It sees only the image you right-click.
• Nothing leaves your computer: images are converted on your device. No uploads, no analytics, no account.
• Four permissions only: contextMenus, downloads, storage, offscreen.
• Open source under the MIT licence, with no build step, so what you read is what runs.
• Not for sale: no ads, no review requests, no welcome tabs. A small window opens only when a save needs your OK.
• Every free feature stays free.

WHEN A SITE BLOCKS AN IMAGE

A few sites stop other sites from reading their images. Only then, and only when you click "Allow and save", Imgkeep asks Chrome for access to that one site. You can remove it any time in Options. Or choose "Save original format instead".

COMING LATER: IMGKEEP PRO

Rules that send each site's images to the right folder, in the right format, with the right name, without choosing every time, plus a log of where every image came from. Everything in Imgkeep today stays free.

## Privacy practices tab

### Single purpose

Save the image you right-click in the format and folder you choose.

### Permission justifications

- **contextMenus:** Adds the "Imgkeep: Save image as" entry (PNG, JPG, WebP, Original format) to the right-click menu on images. This menu is the only way to use the extension.
- **downloads:** Saves the converted image, or the original file, through Chrome's downloads, with the subfolder and file name the user set, and without overwriting existing files.
- **storage:** Stores the user's settings (save mode, subfolder, file-name template, quality, JPG background colour) in Chrome sync storage, and keeps a pending save in session storage while the small decision window is open.
- **offscreen:** Creates an offscreen document to decode the image and re-encode it with a canvas on the user's computer, and to write the file into the folder the user chose. Service workers have no DOM or canvas for this.
- **Optional host access (http://\*/\*, https://\*/\*):** Not granted at install. Some sites block cross-site reads of their images, so the conversion fails. Only then, and only after the user clicks "Allow and save", Imgkeep requests access to that one site (for example https://example.com/\*), to fetch the image the user right-clicked. Each site can be removed in Options. No content scripts are used and no page content is read.

### Remote code

No, I am not using remote code. All code is packaged in the extension. There are no external scripts, fonts, eval or dynamically loaded code.

### Data usage

What user data do you plan to collect from users now or in the future? **None.** (Leave every category unticked: personally identifiable information, health, financial and payment, authentication, personal communications, location, web history, user activity, website content.)

Certifications (tick all three):

- [x] I do not sell or transfer user data to third parties, outside of the approved use cases.
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
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
| `store/promo-tile-440x280.png` | 440×280 | Small promo tile |

Regenerate them with `npm run store` (renders `store/scenes.html` with Playwright).
