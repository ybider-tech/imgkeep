# Changelog

## 0.9.0 — unreleased

- **The anonymous daily summary moves from Aptabase to PostHog** (open source, EU cloud), which shows the numbers far more clearly. Announced on imgkeep.app/whats-new.html and in the privacy policy first. Same counts, still one summary a day, still one click off in Options.
- Each summary is an anonymous PostHog event: a new random id every time, no person profile (`$process_person_profile: false`), and no location lookup (`$geoip_disable: true`). The PostHog project discards client IP addresses, so no IP, country or city is stored (Aptabase kept the country). Unpacked copies mark their summaries `debug: true`.
- `lib/telemetry.js` still makes exactly one request, now only to `https://eu.i.posthog.com/i/v0/e/`; the static check allows that address and no other. Privacy policy, Options (9 languages), README, PERMISSIONS.md and the store notes name PostHog.

## 0.8.1 — 2026-10-14

- **The anonymous daily summary also counts what is converted into what,** for example WebP → JPG or AVIF → PNG (`webp_to_jpg`, `avif_to_png`…), so we know which conversions matter most. The original's format comes from the image's own bytes (or its type, for SVG), never from its address or name. Original format saves aren't conversions and aren't counted this way. Listed in the privacy policy.

## 0.8.0 — 2026-10-12

- **Find image here.** On sites that cover their photos with another layer (Instagram, Pinterest, Facebook, X, Tumblr, Flickr, Threads), the right-click can't reach the image, so Imgkeep's menu never appeared there. Now those sites get **Imgkeep: Find image here…**: Imgkeep looks at that page once, finds the image under the click (its largest version), and opens it in More options. On feeds where the cover is a link (Pinterest, Instagram grids), the right-clicked link decides which image. Without one, the pointer is only a guess: if other images are near, a picker shows the images on screen with the guess first; if there are none, it says so.
- **Opt-in, with two optional permissions** (`activeTab`, `scripting`) that stay off until you turn them on, in Options → Images that sites cover or the first time you use it. Neither comes with an install warning; install permissions stay at four. The finder (`extension/lib/find-image.js`) only reads image addresses, never changes the page, and only runs when you click it. The static check allows exactly these two optional permissions, and `chrome.scripting` only in `background.js`.
- **The promise is reworded,** in the store descriptions (9 languages), the website, Options and the privacy policy: "Imgkeep doesn't read the sites you visit, with one exception you control: when you ask it to find a hidden image, it looks at that page, just once, at that moment. It never changes a page. Off until you turn it on."
- The anonymous daily summary also counts how often Find image here was turned on, found an image, showed a list or found nothing (listed in the privacy policy).

## 0.7.1 — 2026-10-12

- **Uninstall form.** After someone removes Imgkeep, the browser opens a short, optional Google Form: why they removed it (5 reasons or "Other") and what would have made them keep it. The address carries only the version (`lib/uninstall.js`); the form collects no email addresses. Registered with `chrome.runtime.setUninstallURL`, which needs no permission. The static check allows exactly that one form address. The privacy policy has a new "When you remove Imgkeep" section.

## 0.7.0 — 2026-10-10

- **"Last used" at the top of the menu.** After your first save from the right-click menu, its format is offered again as the first item, for example "JPG (last used)", always in the same spot. The format list below doesn't move. Copy as PNG and More options don't change it. (From GitHub Ideas #1.)
- **Anonymous daily summary** (announced with 0.6.1). Imgkeep counts on your computer how its features are used, and once a day sends the previous active day's totals to Aptabase (open source, EU-hosted) as one event: successful saves per format and save mode, saves made smaller by the maximum width, failures by error type, copies, More options use, site-access and rating answers, plus version, browser and language. Never images, addresses, site or file names, settings text or identifiers; each summary gets a new random session id. On by default; Options → Anonymous usage counts shows exactly what's counted and sent, and turns it off (which also deletes what wasn't sent yet). A summary that can't be sent is retried, and dropped after 7 days.
- One direct request from `extension/lib/telemetry.js` (no SDK, no new permission). The static check allows exactly that file to fetch, exactly once, to `https://eu.aptabase.com/api/v0/event`.
- Wording: "No tracking" becomes "No personal data" in the store summary (9 languages); store descriptions, Options, website and privacy policy describe the summary. The store's data-use answers change (see `store/listing.md`).

## 0.6.1 — 2026-10-09

- **New store name, keywords first:** "Save image as PNG, JPG, WebP, GIF or PDF — Imgkeep", in all 9 languages.
- **"New" in the right-click menu.** After an update, items added since your previous version say "New" for 30 days (for example "Copy as PNG ✨ New" when updating from 0.4.0). A fresh install labels nothing.
- **One rating ask.** After at least 15 successful saves or copies, 7 days after install (or after updating to 0.6.1), and only if the last 3 saves worked, Imgkeep asks once: a short note after a copy or a save in More options, and an "Enjoying Imgkeep? Rate it…" menu item for up to 14 days. "Rate Imgkeep" opens the Chrome Web Store or Edge Add-ons review page for the browser you're using; "No thanks" or no answer within 14 days ends it for good. The counting happens in the extension's local storage and is never sent anywhere.
- **Options:** "What's new" (imgkeep.app/whats-new.html) and "Rate Imgkeep" links next to the version.
- **Announced for 0.7.0:** one anonymous daily summary of feature use and failed saves, sent to Aptabase (open source, EU-hosted), on by default with a one-click off switch in Options. Published on imgkeep.app/whats-new.html and in the privacy policy before it ships.
- The public promise changes from "no review requests" to "asks for a rating once, after you've used it for a while": Options, store descriptions in all languages, the website and the privacy policy (which now mentions the local counts).

## 0.6.0 — 2026-10-06

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
