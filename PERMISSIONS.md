# Permissions

Imgkeep asks for as little as it can. This table lists everything in `extension/manifest.json`.
`npm test` fails if the manifest ever differs from it.

| Permission | Type | Why Imgkeep needs it | Since |
|---|---|---|---|
| `contextMenus` | Required | Adds "Imgkeep: Save image as" (PNG, JPG, WebP, GIF, PDF, Original format, Copy as PNG, More options…) to the right-click menu on images. | 0.3.0 |
| `downloads` | Required | Saves files through Chrome's downloads with your subfolder and file name, never overwriting (`conflictAction: "uniquify"`). | 0.3.0 |
| `storage` | Required | Keeps your settings in Chrome sync storage, a pending save in session storage while one of Imgkeep's small windows is open, the format and width you last used in More options, a count of saves for the one-time rating ask and the "New" menu labels, and today's anonymous usage counts until they're sent as the one daily summary (off in Options), in local storage. Nothing else in storage is sent anywhere. | 0.3.0 |
| `offscreen` | Required | A hidden extension page with a canvas, to decode and re-encode the image on your computer and write into your chosen folder. Service workers have no canvas. | 0.3.0 |
| `activeTab` | Optional, off until turned on | Only for **Find image here** on sites that cover their images (Instagram, Pinterest…). When you click that menu item, Chrome lets Imgkeep look at that one tab, at that moment. Turned on in Options → Images that sites cover, or the first time you use it. No install warning. | 0.8.0 |
| `scripting` | Optional, off until turned on | Runs the small finder (`extension/lib/find-image.js`) once in that tab, using the access above. It only reads the addresses of the images on screen; it never changes the page. No install warning. | 0.8.0 |
| `http://*/*`, `https://*/*` | Optional, per site | Not granted at install. Asked for one site at a time (`https://that-site/*`), only when that site blocks cross-site image reads, and only after you click "Allow and save". Removable in Options → Sites you've allowed. | 0.3.0 |

## What Imgkeep does not ask for

- No `host_permissions`, no `<all_urls>`. Without the two optional permissions below it can't read the pages you visit, and it never changes them.
- No content scripts (nothing runs on pages by itself), no `tabs`. `scripting` is only optional, for Find image here. ("Open image" uses `chrome.tabs.create`, which needs no permission.)
- No `clipboardWrite` or `clipboardRead`. Copy as PNG writes the image from Imgkeep's own small window, which has focus, so the browser allows it without a permission (and without the install warning a new permission would bring). Imgkeep never reads the clipboard.
- No `unlimitedStorage`, `history`, `cookies`, `webRequest` or `identity`.

## Network use

Two network requests, and only these:

- `fetch()` of the image you clicked, in `extension/offscreen.js`.
- Since 0.7.0, one anonymous daily summary of feature use, in `extension/lib/telemetry.js`, to exactly `https://eu.aptabase.com/api/v0/event`. On by default, off in Options. What it contains is listed in the privacy policy, and Options shows it.

Not a request: after an uninstall, the browser opens the optional uninstall form (`chrome.runtime.setUninstallURL`, a Google Form whose address carries only the version). Imgkeep sends nothing there itself.

Neither needs a permission: the image request uses the optional per-site access when needed, and Aptabase allows cross-origin requests. The static check (`tests/static-check.mjs`) fails the build if `fetch(` appears in any other file, if `lib/telemetry.js` makes more than one request or to any other address, or if any file references a URL other than imgkeep.app, the two stores or Aptabase.
