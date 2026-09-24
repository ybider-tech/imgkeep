# Permissions

Imgkeep asks for as little as it can. This table lists everything in `extension/manifest.json`.
`npm test` fails if the manifest ever differs from it.

| Permission | Type | Why Imgkeep needs it | Since |
|---|---|---|---|
| `contextMenus` | Required | Adds "Imgkeep: Save image as" (PNG, JPG, WebP, Original format) to the right-click menu on images. | 0.3.0 |
| `downloads` | Required | Saves files through Chrome's downloads with your subfolder and file name, never overwriting (`conflictAction: "uniquify"`). | 0.3.0 |
| `storage` | Required | Keeps your settings in Chrome sync storage, and a pending save in session storage while the small decision window is open. | 0.3.0 |
| `offscreen` | Required | A hidden extension page with a canvas, to decode and re-encode the image on your computer and write into your chosen folder. Service workers have no canvas. | 0.3.0 |
| `http://*/*`, `https://*/*` | Optional, per site | Not granted at install. Asked for one site at a time (`https://that-site/*`), only when that site blocks cross-site image reads, and only after you click "Allow and save". Removable in Options → Sites you've allowed. | 0.3.0 |

## What Imgkeep does not ask for

- No `host_permissions`, no `<all_urls>`: it can't read or change the pages you visit.
- No content scripts, no `scripting`, no `tabs`.
- No `unlimitedStorage`, `history`, `cookies`, `webRequest` or `identity`.

## Network use

The only network request is `fetch()` of the image you clicked, in `extension/offscreen.js`.
The static check (`tests/static-check.mjs`) fails the build if `fetch(` appears in any other file,
or if any file references a URL other than imgkeep.app or the Chrome Web Store.
