# SEO rollout: converter pair pages

One page per format pair the [Free Image Converter](https://imgkeep.app/convert/) really supports, rendered from
`data/pairs.json` and `data/formats.json` by `scripts/build-pair-pages.mjs`. Every page lists here with the wave and
date it went live, so Search Console's numbers can be matched to what changed.

## Wave 0 (before the template)

Existing pages, moved onto the template on 2026-11-25 with no change: same addresses, titles and text, byte for byte
(translated versions untouched).

- `/webp-to-jpg/`
- `/webp-to-png/`
- `/avif-to-jpg/`
- `/png-to-jpg/`
- `/png-to-ico/`
- `/heic-to-jpg/`
- `/heic-to-png/`

## Wave 1: 13 new pairs, English (live 2026-11-25)

Chosen from Search Console (28 days to 2026-11-21, 1,928 impressions): queries next to PNG to ICO (246 impressions),
PNG/JPG (56), AVIF (58), WebP to GIF (10, position 25 for "save webp as gif"), PDF (10) and JFIF (the JFIF guide at
position 11), plus three by reasoning: PNG to WebP, SVG to PNG, HEIC to PDF.

- `/jpg-to-png/`
- `/png-to-webp/`
- `/avif-to-png/`
- `/webp-to-gif/`
- `/avif-to-gif/`
- `/jfif-to-jpg/`
- `/jfif-to-png/`
- `/jpg-to-pdf/`
- `/png-to-pdf/`
- `/heic-to-pdf/`
- `/svg-to-png/`
- `/jpg-to-ico/`
- `/svg-to-ico/`
- `/convert/formats/`: the index of every pair page

Translations of wave 1, one language at a time, in the order of the languages' average Search Console position
(best first). `langs` in `data/pairs.json` lists the languages each page is published in; the language menus,
hreflang, links and sitemap follow it.

| Language | Live | Pages |
|---|---|---|
| Ukrainian (`uk`) | 2026-11-25 | 13 pairs + the index |

## Later waves (supported, not built yet)

`heic-to-webp`, `heic-to-avif`, `webp-to-avif`, `webp-to-pdf`, `webp-to-ico`, `avif-to-webp`, `avif-to-pdf`, `jfif-to-pdf`, `png-to-avif`, `png-to-gif`, `png-to-bmp`, `jpg-to-webp`, `jpg-to-avif`, `jpg-to-gif`, `jpg-to-bmp`, `svg-to-jpg`, `svg-to-webp`, `svg-to-pdf`, `gif-to-jpg`, `gif-to-png`, `gif-to-webp`, `bmp-to-jpg`, `bmp-to-png`, `bmp-to-webp`, `bmp-to-pdf`, `ico-to-jpg`, `ico-to-png`

## Skipped (supported, but nothing worth a page)

- `heic-to-gif`: A photo as a 256-colour GIF gives a worse, bigger file
- `heic-to-ico`: Icons aren't made from phone photos
- `heic-to-bmp`: Huge files with no benefit over JPG or PNG
- `webp-to-bmp`: No practical use beyond PNG
- `avif-to-ico`: Icons come from PNG or SVG sources
- `avif-to-bmp`: No practical use beyond PNG
- `jfif-to-webp`: A .jfif is a JPG: the JPG pages cover it, and this pair has no search of its own
- `jfif-to-avif`: Same as JPG to AVIF; no JFIF-specific need
- `jfif-to-gif`: A photo as a 256-colour GIF gives a worse, bigger file
- `jfif-to-ico`: Same as JPG to ICO
- `jfif-to-bmp`: Same as JPG to BMP; rare
- `svg-to-avif`: Nobody needs a vector logo as AVIF
- `svg-to-gif`: PNG does the same with better colour
- `svg-to-bmp`: No practical use beyond PNG
- `gif-to-avif`: Rare; animated AVIF is barely supported outside browsers
- `gif-to-pdf`: Only the first frame; no practical use
- `gif-to-ico`: Animated icons aren't supported in .ico
- `gif-to-bmp`: Loses the animation for a bigger file
- `bmp-to-avif`: Rare
- `bmp-to-gif`: No practical use
- `bmp-to-ico`: Rare; PNG to ICO covers it
- `ico-to-webp`: No practical use
- `ico-to-avif`: No practical use
- `ico-to-gif`: No practical use
- `ico-to-pdf`: No practical use
- `ico-to-bmp`: No practical use

## Similarity at wave 1

Share of each page's own 5-word phrases (short answer to FAQ, without the shared converter and extension box) that
another page also has. `node scripts/build-pair-pages.mjs --similarity`; the tests hold new pages to 35%.

```
20 pages, 190 pairs of pages. Shared 5-word shingles: highest 60.5%, average 3.1%, limit 35%.
   60.5%  heic-to-jpg · heic-to-png
   29.7%  png-to-ico · jpg-to-ico
   22.1%  webp-to-gif · avif-to-gif
   18.3%  webp-to-jpg · avif-to-jpg
   17.1%  jpg-to-pdf · png-to-pdf
   16.1%  webp-to-jpg · png-to-jpg
   15.1%  jpg-to-png · jfif-to-png
   12.7%  webp-to-jpg · webp-to-gif
   10.7%  avif-to-jpg · jfif-to-jpg
   10.1%  jpg-to-ico · svg-to-ico
Known, from before the template: heic-to-jpg · heic-to-png
```

The HEIC to JPG and HEIC to PNG pages (wave 0, 2026-11-24) share most of their text; rewrite one before relying on
both for search.
