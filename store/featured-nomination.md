# Featured badge nomination (Chrome Web Store)

> **Status 2026-09-28: obsolete.** Chrome Web Store is discontinuing the Featured badge later in 2026; self-nominations closed on 20 Aug 2026 (developer.chrome.com/blog/cws-review-updates-2026). Kept only for reference. The marquee tile is separate and still worth uploading: Google's team picks carousel items itself, and a tile is required to be eligible.

**When:** after 0.4.0 is approved and the marquee tile (`store/marquee-1400x560.png`) is uploaded, so Google reviews the best version of the listing.

**Where:** Chrome Web Store developer support ("One Stop Support"), signed in as helloimgkeep@gmail.com: https://support.google.com/chrome_webstore/contact/one_stop_support. Choose the option to nominate your extension for a Featured badge and be eligible for merchandising (the exact wording may differ).

## Details to enter
- **Item ID:** fkclfgbmjaafglfifenonfcahfdmajbl
- **Listing:** https://chromewebstore.google.com/detail/fkclfgbmjaafglfifenonfcahfdmajbl
- **Website:** https://imgkeep.app · **Source:** https://github.com/ybider-tech/imgkeep

## Message
```text
Imgkeep adds one right-click menu to images: save as PNG, JPG, WebP or GIF (keeping animation), or in the original format. It solves a common problem: sites now serve WebP and AVIF files that many apps can't open.

Why we think it deserves the Featured badge:

- Minimal permissions: only contextMenus, downloads, storage and offscreen. No host permissions at install and no content scripts. Access to one site is requested only when that site blocks an image, and only after the user clicks.
- Privacy by design: images are converted locally in an offscreen document. No analytics, no remote code, no account. The only network request is the image the user clicked. Data use is declared as "none" and the privacy policy is at imgkeep.app/privacy.html.
- Manifest V3, plain JavaScript with no build step, and open source under the MIT licence, so anyone can check what it does. Automated tests cover every format, every save mode and a check that fails if permissions or network use ever grow.
- A respectful experience: no ads, no review prompts, no welcome tabs, no upsells. It never overwrites a file. The options page is accessible (labelled controls, keyboard focus, light and dark mode).
- Clear listing: accurate description, real screenshots, support page and a public feature-request board.
- A safe choice for users of the removed "Save image as Type" extension, which was taken down in March 2026 after it was found injecting affiliate links. Imgkeep offers the same everyday task with a fraction of the access.

Thank you for considering it.
```

## Notes
- Every claim above is true for 0.4.0. Re-check before sending if anything changes (permissions, network use, pricing).
- If Google asks for changes, reply on the same thread and log it in `Output/Decisions/SEO Strategy - Imgkeep.md`.
