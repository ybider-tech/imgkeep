# Imgkeep — Cobalt Pop release assets

Approved photographic orange poppy, white image frame and mint download arrow, on cobalt. Prepared 10 November 2026. English feature copy. Store listings have not been submitted.

## Upload map

| Destination | Files | Size / use |
| --- | --- | --- |
| Chrome Web Store | `chrome/icon-128.png` | 128×128 RGBA; artwork inside a centred 96px box |
| Chrome screenshots | `chrome/screenshots/01…05*.png` | Five 1280×800 RGB PNGs, numbered in suggested order |
| Chrome small promo | `chrome/small-promo-440x280.png` | 440×280 RGB PNG |
| Chrome marquee | `chrome/marquee-1400x560.png` | 1400×560 RGB PNG; optional |
| Edge Add-ons logo | `edge/logo-300.png` | 300×300 RGBA PNG |
| Edge screenshots | `edge/screenshots/01…05*.png` | Five 1280×800 RGB PNGs; same feature copy as Chrome |
| Edge promos | `edge/small-promo-440x280.png`, `edge/marquee-1400x560.png` | Optional 440×280 and 1400×560 PNGs |
| Firefox AMO icons | `firefox/icon-32.png`, `icon-64.png`, `icon-128.png` | Standard / high-density / larger source |
| Firefox screenshots | `firefox/screenshots/01…05*.png` | Five 1280×800 PNGs with little added text and larger UI |
| Firefox screenshot descriptions | `firefox/captions.txt` or `captions.json` | Paste each matching description into AMO |
| Next extension package | `extension-icons/icon{16,32,48,64,128}.png` | The repository’s icon pipeline and manifest are updated; extension version is unchanged |
| Website | `website/` | Header/footer icon128, favicon PNG/ICO, 180px opaque Apple touch icon, 192/512px sources and 1200×630 social image |

Chrome accepts up to five screenshots. Edge accepts up to six at the supplied size. AMO recommends screenshots without much embedded text; its separate descriptions carry the feature copy. AMO does not use Chrome’s promo-tile fields. Optional videos are not required for this pack.

For a package update, use the existing release workflow to increment the extension version and include the new icon files. This pack does not publish a new extension version. Upload the English screenshots to English listing fields; the image-only promos and photographic icon can be shared between locales.

## Content and typography

1. Save it in your format — actual PNG-to-WebP preview, encoded using the current source conversion helper.
2. Pinterest — interior photo with current More options controls.
3. Instagram — café photo with current More options controls.
4. Animated GIF — three-frame cat-yawn filmstrip; existing GIF bytes are preserved.
5. Colour palette — jelly photo with the current palette UI and colours calculated from that photo.

Every Chrome/Edge feature image uses the same 72px Schibsted Grotesk Bold title at (40,110), 28px Arial subtitle at (40,202), 34px wordmark, 22px result caption and 16px footer. Native control fonts inside captured source-rendered windows are unchanged. Exact values are in `typography.json`.

The photos come from the previously approved generated artwork. The controls are rendered from repository source (base `91d2e0d`) through the local fixture adapter in `source/ui/preview-shim.js`. These are illustrative workflows, not live captures of Pinterest or Instagram or an installed extension. Find image here must be enabled before using it on covered images. No unverified platform affiliation, download-count or store-ranking badges are used.

The GIF screenshot is static because listing screenshots are PNGs. The working looping animation is `source/ui/demo/cat-yawn-saved.gif`. The real `extension/lib/convert.js` helper returned byte-identical GIF output; `qa/gif-preservation.json` records the check. The cross-browser copy claims preservation of an existing GIF. It does not promise animated WebP/AVIF/APNG conversion in Firefox.

## Website integration

The existing GitHub Pages website is updated in the companion repository branch: new brand images, cobalt accents in light and dark themes, versioned image/CSS URLs, corrected touch-icon references across 180 HTML pages, and wrapping mobile navigation. The converter, copy, privacy controls and page structure are retained. `store/og.html` is updated so future social-image rendering keeps this style. `scripts/make-icons.py` now copies the canonical flower artwork at every size instead of recreating the previous illustrated icon.

## Validation

`validation.json` records dimensions, colour modes, checksums, Chrome padding, 386 website asset references, CSS cache version, changed accent contrast, and the three-frame GIF check. `qa/` contains contact sheets and desktop/mobile/Hebrew website previews. Source artwork and code-generated typography stay separate so type changes do not regenerate the photography.

## Official specifications

Checked 10 November 2026:

- [Chrome listing graphic fields](https://developer.chrome.com/docs/webstore/cws-dashboard-listing) and [image guidance](https://developer.chrome.com/docs/webstore/images).
- [Microsoft Edge listing assets](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension).
- [Firefox listing design guidance](https://extensionworkshop.com/documentation/develop/create-an-appealing-listing/) and [Firefox manifest icons](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/icons).

Photography was generated for this project and approved in the design session. Schibsted Grotesk is under the SIL Open Font License; repository font licences are in `site/fonts/`. Arial is used from the authoring system and is not redistributed. Extension source used for previews is under the repository’s MIT licence.
