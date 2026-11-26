# Imgkeep store listings: keyword research

Research only, 26 November 2026. No listing, site or extension file was changed. Every number below comes from a source named in section 1. Where a source couldn't be reached, the report says so instead of estimating.

## Summary

- **"WebP to JPG" and "WebP to PNG" have the most demand of anything Imgkeep does, and the current title doesn't say either.** Worldwide and in each of the top 5 countries, Google Trends puts them at or near the top of Imgkeep's real functions. "webp to jpg" is the second suggestion in Edge's search box, and Chrome's search box offers it three times when you type "jpg", and 14 of 58 competitor titles use the phrase. The current title lists WebP only as a format to save *to*. It never says *from* WebP, or AVIF.
- **"Save image as" is the phrase the stores themselves revolve around.** It's in 22 of the 58 competitor titles, and Chrome, Edge and Firefox autocomplete are full of it ("save image as type", "save image as png"…). On Google it's strong only in the US. Keep it.
- **AVIF has real but smaller demand with little competition:** 37% of "webp to jpg" worldwide, but only 3 of 58 competitor titles. It's missing from the current Chrome title and short description.
- **Nobody searches for "Imgkeep".** In 90 days of Search Console data no query contains the name, so the title has to carry the function.
- **The colour palette has no measurable demand.** It scores 2 on Trends, has 27 Search Console impressions in 90 days, and appears in no competitor title or summary. It sets Imgkeep apart, but it doesn't earn space in a 132-character summary.
- **Imgkeep isn't in the top 10 for "save image as" or "webp to jpg" in any of the three stores** (top 20 on Edge). The leaders have 10,000 to 400,000 users and up to 3,851 ratings, against Imgkeep's 163 users on Chrome. Wording can match more searches, but ranking also depends on users and ratings.
- **Two constraints change how a change ships:**
  - On Chrome and Edge, the title and short description are inside the extension package. Changing them needs a new release, in all 51 locales.
  - Edge rejected 0.11.0 on 2026-11-03 for "excessive search terms" in the title.

## 1. Data sources and dates

| Source | What | Period / fetched | Status |
|---|---|---|---|
| Google Search Console, imgkeep.app | Top queries with clicks, CTR, position; query × country; query × page | 2026-08-27 to 2026-11-24 (90 days), pulled 2026-11-26 via the existing service account (read-only) | ✅ |
| Google Trends, Explore | 5-phrase comparisons, past 12 months, worldwide + US, JP, BR, RU, DE (the top 5 countries by Search Console impressions) | fetched 2026-11-26 | ✅ |
| Chrome Web Store search | Top 10 for "save image as" and "webp to jpg": name, summary, users, rating | fetched 2026-11-26, hl=en | ✅ |
| Chrome Web Store autocomplete | Suggestions for the 6 prefixes | screenshots taken by Yaron in his Chrome, 2026-11-26 | ✅ Taken by hand: Chrome doesn't let extensions read or screenshot the store. |
| Edge Add-ons search + autocomplete | Top 10 (of 20 fetched) for both queries; suggestions for the 6 prefixes | fetched 2026-11-26, en-US, US | ✅ The search API doesn't return user counts, so ratings only |
| Firefox Add-ons search + autocomplete | Top 10 for both queries; suggestions for the 6 prefixes | fetched 2026-11-26, en-US (public AMO API v5) | ✅ Users are AMO's average daily users |
| Limits and policies | Chrome manifest docs, Chrome program policies and listing guide; Edge publish guide and developer policies; Firefox Extension Workshop; MDN `name` | fetched 2026-11-26 | ✅ |

Caveats:
- **Search Console covers Google web search for imgkeep.app only.** It doesn't see store searches or the store listing pages, and most impressions come from the converter pages, not the extension. Only 863 of the 2,910 impressions fall in named queries; Google withholds the rest as rare queries.
- **Trends covers Google web search, not store search.** It's relative interest within each comparison. I put "webp to jpg" in every comparison and scaled each one to it, so **webp to jpg = 100 in every column**. I compared English phrases only.

## 2. The data

### 2.1 Search Console, 90 days, by theme

Totals: 2,910 impressions, 58 clicks, CTR 2.0%, average position 25.3. Top countries by impressions: US 524, Japan 206, Brazil 204, Russia 189, Germany 137, Ukraine 110, Spain 103, Italy 101, Korea 100, Israel 76.

| Theme | Queries | Impressions | Clicks | Avg. position (weighted) |
|---|---:|---:|---:|---:|
| PNG/JPG to ICO | 104 | 326 | 3 | 68.8 |
| WebP (to JPG/PNG/GIF, "save webp") | 93 | 177 | 5 | 55.3 |
| PNG ↔ JPG and other format pairs | 88 | 141 | 0 | 52.0 |
| AVIF | 50 | 86 | 0 | 59.8 |
| Save image as / right-click | 28 | 54 | 1 | 35.4 |
| Colour palette | 10 | 27 | 0 | 63.0 |
| PDF | 5 | 9 | 0 | 46.9 |
| GIF | 1 | 1 | 0 | 83.0 |
| Brand ("imgkeep") | 0 | 0 | 0 | — |
| Other | 24 | 42 | 0 | — |

The only ID-style query was `gabfmnliflodkdafenbcpjdlppllnemd` (5 impressions, position 7.8). That's another extension's Chrome ID, and it landed on our `/save-image-as-type-alternative/` page. It isn't brand demand for Imgkeep.

The full top 100 queries, with countries and pages, are in the appendix.

**The "save image as" queries are mostly not in English:**
- guardar imagen como: 10 impressions, position 20.7
- guardar como: 8
- extension guardar imagen como: 4, position 27.5
- сохранить картинку как: 2, position 9
- salvar imagem como tipo: 1, position 7
- save image as type chrome: 2, position 11

That points to the translated titles mattering as much as the English one.

### 2.2 Google Trends, past 12 months (webp to jpg = 100 in each column)

| Phrase | World | US | JP | BR | RU | DE |
|---|---:|---:|---:|---:|---:|---:|
| png to jpg | 195 | 190 | 123 | 131 | 60 | 133 |
| jpg to png | 195 | 190 | 129 | 129 | 62 | 130 |
| **webp to jpg** | **100** | **100** | **100** | **100** | **100** | **100** |
| **webp to png** | **99** | **156** | **141** | **217** | **66** | **111** |
| image downloader | 46 | 55 | 97 | 28 | 0 | 21 |
| avif to jpg | 37 | 30 | 8 | 31 | 6 | 30 |
| webp converter | 28 | 26 | 3 | 225 | 0 | 8 |
| save image as | 27 | 105 | 14 | 6 | 2 | 11 |
| png to ico | 23 | 28 | 0 | 51 | 15 | 38 |
| save image as type | 4 | 8 | 3 | 0 | 0 | 0 |
| color palette from image | 2 | 10 | 3 | 0 | 0 | 0 |
| image converter extension | 0 | 0 | 0 | 0 | 0 | 0 |
| save webp as jpg | 0 | 0 | 0 | 0 | 0 | 0 |

Two things to read with care:
- **The PNG ↔ JPG searches are mostly about files already on someone's computer.** The extension saves images from web pages, so those searches fit the site's converter better than a store title.
- **"save image as" on Google includes general how-to searches,** for example how to save an image at all.

### 2.3 Store autocomplete (recorded exactly)

**Edge Add-ons** (en-US, US): suggested search terms, then suggested add-ons.

| Typed | Search terms suggested | Add-ons suggested |
|---|---|---|
| save image | save image as type · save image · save image as png · save image as gif · save image as · save images · save images as | DragFree (Mouse Unblock+Char Count+Image Save+Capture) |
| webp | webp · webp to jpg · webpage translator · webpage · webpage to pdf | MConverter - File Converter: AVIF, JXL, WebP · PageSaver - Webpage to PDF & Full Page Screenshot · Summary Webpage - Summarize Youtube videos \| AI - Assistant |
| image conv | image converter · image converter to text | Bulk Image Convert |
| avif | avif · avif image converter | MConverter - File Converter: AVIF, JXL, WebP |
| png | png · png downloader · png file converter · png下载 · png图片下载 · png图片 · png转pdf · png get | — |
| jpg | jpg to pdf converter · jpg · jpg view · jpg to pdf · jpg to pdf tools · jpg转pdf · jpg下载 | PDF to JPG |

**Firefox Add-ons** (en-US). AMO's autocomplete suggests add-on names, not search terms:

| Typed | Suggestions |
|---|---|
| save image | Download All Images · Image Max URL · Search by Image · Save image as Type · TinEye Reverse Image Search · Save Image In Folder · Eagle - Save images faster than ever · Save Image to Downloads · Image Search Options · image-save |
| webp | WebP Convert · Save webP as PNG or JPEG (Converter) · Don't "Accept" image/webp · WebP / Avif image converter · Web Archives · TWP - Translate Web Pages · Save Webp as Jpg on 9gag · Save Image As Type - WebP to JPG, PNG, PDF · Disable WebP Images · WebP → JPEG Downloader |
| image conv | Search by Image · Image Max URL · Download All Images · Image Search Options · Reverse Image Search · TinEye Reverse Image Search · WebP / Avif image converter · View Image · Zoom Image · Image Converter (en-CA) |
| avif | WebP / Avif image converter · AVIF MIME Fix · Image Converter – JPG, PNG, WEBP & AVIF · Don't "Accept" image/webp · Citavi Picker · Image Converter (en-CA) · Save Image as PNG & JPG - WebP/AVIF Converter · Save Image As Type - WebP to JPG, PNG, PDF · Avira Browser Safety · PhotoConvert - Image Converter |
| png | WebP Convert · Save webP as PNG or JPEG (Converter) · Copy as PNG · Save As PNG! · SaveAsPNG · Save Image As Type - WebP to JPG, PNG, PDF · Image to PNG Converter · PNG Optimizer · Webseite in PDF, PNG, JPG (de) · Save Image As PNG/JPG (en-GB) |
| jpg | PDF to JPG Converter · Save Webp as Jpg on 9gag · Save Image As Type - WebP to JPG, PNG, PDF · Webseite in PDF, PNG, JPG (de) · HEICFlip — HEIC to JPG, PNG & PDF · Save Image As PNG/JPG (en-GB) · Save Image as JPG (pl) · JPG to PDF Converter · Save Image as JPG or PNG · Save image as Type |

**Chrome Web Store** (from Yaron's screenshots, 2026-11-26). Chrome shows add-ons (with icon) first, then search suggestions (🔍). Recorded exactly, top to bottom:

| Typed | Add-ons suggested | Search suggestions (🔍) |
|---|---|---|
| save image | Save Image As PNG · Save image as Type · Image Downloader - Save pictures · Shopee Save - Download Product Images & Video · Save Image As Type · Image Downloader - Fiktu AI Batch Save (Fatkun) · Save Image as Type — JPG PNG WebP PDF, Resize & Remove Background · Save Image To Google Photos · Save Images to Google Photos™ | WA Media Downloader: Save WA Video, Image & Audio - WPPME.COM |
| webp | Convert webpage to PDF · ZIZIYI Space: Chat with Webpages in ChatGPT, Claude, Grok & Gemini · AI Blaze: Instantly Use AI in Any Webpage · Save Image as Type — JPG PNG WebP PDF, Resize & Remove Background · Summary Webpage - Summarize Youtube videos \| AI - Assistant · MarkSnip - Webpage to Markdown Clipper · Briefy: AI summarizer with visual views for webpages, YouTube, PDFs | Webpage Screenshot - Entire page screenshot! · Screenshot Entire Webpage · Bulk PDF Downloader – Download All PDFs on a Webpage with One Click |
| image conv | Tukar - Image Converter & Background Remover · Bulk Image Convert · WebP / Avif image converter · Image to PDF Converter : Save as Pdf · Convert and Save Image as · Image Converter | Save As Image Converter · Compress Image to 500kb » Convert JPG to 500kb · Compress Image to 20KB » Convert JPG to 20KB · Bulk Image format Converter |
| avif | WebP / Avif image converter · MConverter - File Converter: AVIF, JXL, WebP · WebP to PNG & JPG Converter - AVIF, GIF · Save Image as PNG, JPG, WebP, BMP, AVIF, PDF · Animated Image Controls - Scrub through animated WebP, GIF, AVIF, APNG · AVIF Studio - Image Editor With AVIF Support | Image Optimizer & Audit: AVIF, WebP, Alt Text \| AuraImage X-Ray · Save Image As JPG, PNG, WebP, AVIF & Remove Background — QuickConvert · Convert AVIF to JPG · AVIF to JPG |
| png | Save Image As PNG · Save Image as Type — JPG PNG WebP PDF, Resize & Remove Background · WEBP to PNG Converter · Save Image As Png · HEIC to JPG & PNG Converter · Bulk JPEG, PNG Images Optimizer · WebP to PNG & JPG Converter - AVIF, GIF | Save Image As PNG · Favicon Generator – PNG to ICO & Website Icons · Convert PNG to PDF - Images to PDF converter |
| jpg | Save Image as Type — JPG PNG WebP PDF, Resize & Remove Background · Convert WebP to JPG · HEIC to JPG Converter · PDF to JPG · Convert JPG to PDF · Convert WEBP to JPG · PDF to JPG Converter · HEIC to JPG & PNG Converter | Compress Image to 500kb » Convert JPG to 500kb · WebP to JPG Converter |

What Chrome's suggestions add:
- **Chrome matches the start of words, not phrases.** "webp" fills with "webpage" add-ons. So a title that *starts* with the format word ("WebP to JPG…", "Save image as…") matches more typed prefixes than one where it sits in the middle.
- **"WebP to JPG" turns up three times under "jpg"** (Convert WebP to JPG, Convert WEBP to JPG, WebP to JPG Converter), and **"AVIF to JPG" twice under "avif"**. That supports both gaps in section 4.
- **"Save image as Type" appears in 4 of the 5 lists**, under several near-identical names. It confirms the phrase's pull and the crowding around it.
- **Under "image conv", Chrome pairs "convert" with "save image as"** ("Convert and Save Image as", "Save As Image Converter"). That fits a title holding both, like C2.
- **Imgkeep appears in none of them.**

### 2.4 Competitor listings: top 10 per store and query

Users are as the store shows them (Chrome: "N users"; Firefox: average daily users; Edge: not returned by its search). Imgkeep is in none of these lists.

**Chrome, "save image as"**

| # | Title | Short description | Users | Rating (count) |
|---:|---|---|---:|---|
| 1 | Save image as Type | Right-click on any image to convert and download it. Save image type: JPG, PDF, PNG, or GIF from the context menu. | 100,000 | 4.9 (1,253) |
| 2 | Save Image As Type | Use Save Image As Type – convert images to PNG, JPG, WebP or PDF before download. Simple and fast save image as type extension. | 80,000 | 3.6 (617) |
| 3 | Save Image As Type | Right-click any image and save it as JPEG, PNG, or WebP with adjustable quality. | 70,000 | 4.7 (175) |
| 4 | Save Image As PNG | Adds the "Save Image As PNG" option to the context menu of images. | 400,000 | 4.0 (444) |
| 5 | Save Image As... | Right-click any image to save it as PNG, JPG, or WebP. Batch-download all images on a page. | 1,000 | 4.7 (6) |
| 6 | Snag - Save Image As | Save and convert images to JPG, PNG, WebP, GIF, and more. | 20,000 | 3.6 (34) |
| 7 | Save Image As | Save any image as JPG/PNG/WebP with right click | 9,000 | 2.0 (17) |
| 8 | Image Formatter: Save Image As Type | Image Formatter: Simplify Saving – PNG, JPG, WEBP Options from Context Menu | 30,000 | 3.9 (20) |
| 9 | Save Image As PNG | Adds a "Save Image as PNG" option to the right-click menu, allowing you to easily save images in PNG format. Save image as type. | 100,000 | 4.4 (3,851) |
| 10 | Save Image as Any Type | Right-click any image to convert and save it in 8 different formats | 2,000 | 5.0 (15) |

**Chrome, "webp to jpg"**

| # | Title | Short description | Users | Rating (count) |
|---:|---|---|---:|---|
| 1 | WebP to JPG Converter | Easily convert WebP to JPG with this Chrome extension! With just a few clicks quickly to convert to JPG and download any pictures. | 50,000 | 3.9 (30) |
| 2 | Save Image As Type - WebP to JPG, PNG, PDF | Convert WebP to JPG, or save any image as PNG, AVIF or PDF. Pick the folder and filename. No image leaves your device. | 10,000 | 4.2 (16) |
| 3 | Convert WebP to JPG | Convert webp to jpg images online and offline. Save webp images on websites as jpeg files. Convert local webp pictures to JPG, PNG. | 20,000 | 4.8 (89) |
| 4 | Save Image As Type - WebP to JPG Converter | Right-click any image to save or convert it: WebP to JPG, PNG to JPG, AVIF. Set quality, crop, resize and batch-save. | 1,000 | 3.7 (11) |
| 5 | WebP to PNG/JPG Converter - Save Image As | Convert WebP to PNG/JPG instantly. Right-click any image to save in your format. Free converter, no upload needed. | 5,000 | 3.8 (5) |
| 6 | Save WEBP as JPG/PNG | Gives the option to save WEBP images to JPG/PNG | 4,000 | 1.6 (22) |
| 7 | Convert WEBP to JPG | Convert WEBP to JPG images locally without losing quality. No server upload, keeping your data private | 9,000 | 4.7 (21) |
| 8 | WebP to JPG | Quickly Convert WebP to JPG with this free WebP to JPG converter in just 1-Click! | 1,000 | 4.0 (16) |
| 9 | WebP to JPG/PNG Converter Pro | Convert WebP, HEIC, SVG and others to high-quality JPG or PNG instantly. Advanced batch mode and comparison slider included. | 224 | 3.0 (6) |
| 10 | WebP to JPG | Fast conversion of WebP images to JPG/PNG with crop function | 90 | — |

**Edge, "save image as"** (183 results; ratings only)

| # | Title | Short description | Rating (count) |
|---:|---|---|---|
| 1 | ImageAssistant Batch Image Downloader | An image extractor for sniffing, analyzing and batch downloading images from web page. | 4.1 (218) |
| 2 | Search by Image | A powerful reverse image search tool, with support for various search engines… | 4.6 (31) |
| 3 | Image Downloader | Find and download all images on a web page in bulk or individually. | 4.8 (87) |
| 4 | Image Downloader | Easily save all images in a website to a zip file with just one click! | 5.0 (5) |
| 5 | Image Downloader | Using image downloader, locate and download all of the images on a website. | 4.8 (47) |
| 6 | Save to Pinterest | Save ideas to Pinterest. | 3.2 (167) |
| 7 | Bulk Image Convert | Convert multiple images at the same time. | 5.0 (11) |
| 8 | DragFree (Mouse Unblock+Char Count+Image Save+Capture) | Restores mouse drag, right-click, and image save on blocked sites. Adds bulk image save, char counter, and page capture. | 4.0 (20) |
| 9 | Super Save Image As | Save images as png, jpg, or webp by right-clicking on an image. Adds a new context menu to save images in a variety of formats. | 2.0 (4) |
| 10 | Save Image As PNG | Adds a "Save Image as PNG" option to the right-click menu, allowing you to easily save images in PNG format. Save image as type. | 3.3 (32) |

**Edge, "webp to jpg"** (38 results)

| # | Title | Short description | Rating (count) |
|---:|---|---|---|
| 1 | MConverter - File Converter: AVIF, JXL, WebP | Save AVIF, WebP as JPG or PNG. Convert images, video, audio from webpages… | 5.0 (6) |
| 2 | PDF to JPG | Convert PDF to JPG for free. | 3.8 (12) |
| 3 | Free, Fast WEBP to JPG Converter | …convert your webp images to jpg or png format for free. | — (0) |
| 4 | Save Image As Type - WebP to JPG, PNG, PDF | Convert WebP to JPG, or save any image as PNG, AVIF or PDF. Pick the folder and filename. No image leaves your device. | 4.5 (2) |
| 5 | WebP Image Converter - Batch to JPG/PNG | Easily convert and download web images as JPG, or batch convert local files to JPG/PNG… | — (0) |
| 6 | WebP.one - Convert WebP to JPG, PNG, GIF, PDF | Convert WebP files to JPG, PNG, GIF, and PDF. Convert images locally in your browser… | — (0) |
| 7 | Image to JPG Converter - JPG, PNG, WebP | Convert images to JPG, PNG or WebP right in Chrome. Files are processed locally… | — (0) |
| 8 | Image Converter - WEBP, JPG, PNG, HEIC | Convert images between JPG, PNG, WEBP, HEIC, AVIF, BMP, TIFF, GIF, SVG, and ICO… | — (0) |
| 9 | WebP to JPG & PNG — Image Converter \| ToolFit | Right-click any picture to save it as JPG, PNG or WebP. Convert WebP/AVIF in bulk and strip EXIF data — all on your device. | — (0) |
| 10 | Save Image As Type - WebP to JPG Converter | Right-click any image to save or convert it: WebP to JPG, PNG to JPG, AVIF. Set quality, crop, resize and batch-save. | — (0) |

**Firefox, "save image as"**

| # | Title | Summary (shortened) | Daily users | Rating (count) |
|---:|---|---|---:|---|
| 1 | Save Image As | Save any image as PDF, PNG, JPG or WebP. | 236 | — (0) |
| 2 | Save Image As | Right-click images to convert and save them as PNG, JPG, or WebP—locally, privately, and open source. | 53 | — (0) |
| 3 | Download All Images | Easily save images with a wide range of customization features… | 105,247 | 3.9 (658) |
| 4 | Image Max URL | Finds larger/original versions of images… | 34,290 | 4.7 (144) |
| 5 | Search by Image | A powerful reverse image search tool… | 469,070 | 4.6 (1,842) |
| 6 | Save image as Type | Save image as PNG, JPG or WebP by context menu on image. | 23,095 | 4.3 (64) |
| 7 | TinEye Reverse Image Search | Click on any image on the web to search for it on TinEye… | 40,690 | 4.1 (298) |
| 8 | Image Search Options | A customizable reverse image search tool… | 34,005 | 4.6 (446) |
| 9 | Reverse Image Search | Adds an option to the context menu to search with an image… | 15,780 | 4.7 (141) |
| 10 | Save Image In Folder | Save images to different folders in one click!… | 1,429 | 3.8 (66) |

**Firefox, "webp to jpg"**

| # | Title | Summary (shortened) | Daily users | Rating (count) |
|---:|---|---|---:|---|
| 1 | Save Webp as Jpg on 9gag | Saves all Webp Images as Jpg on 9gag | 308 | 2.4 (11) |
| 2 | Save Image As Type - WebP to JPG, PNG, PDF | Convert WebP to JPG, or save any image as PNG, AVIF or PDF… | 1,725 | 4.6 (10) |
| 3 | Save image as Type | Save image as PNG, JPG or WebP by context menu on image. | 23,095 | 4.3 (64) |
| 4 | Save WebP as JPG / PNG | Right-click a WebP image and save it as JPG or PNG… | 12 | — (0) |
| 5 | WebP / Avif image converter | Convert WebP, Avif and other image types before saving… | 16,550 | 3.9 (132) |
| 6 | AnyFormat - Save Image as JPG, PNG, WebP, PDF | Save Image as Type: right-click any image, save it as JPG, PNG, WebP, GIF or PDF… | 23 | 5.0 (1) |
| 7 | Image Converter – JPG, PNG, WEBP & AVIF | Image converter and resizer… never uploads. | 10 | 5.0 (1) |
| 8 | Save webP as PNG or JPEG (Converter) | Convert any image (WebP, AVIF, etc.) to PNG or JPEG… | 78,991 | 4.3 (230) |
| 9 | Don't "Accept" image/webp | This extension removes image/webp and/or image/avif from the list of formats Firefox tells sites… | 20,335 | 4.3 (157) |
| 10 | Save Image As | Save any image as PDF, PNG, JPG or WebP. | 236 | — (0) |

**For reference, Imgkeep's live listings:**
- **Chrome:** 163 users, 0.15.1, title "Save image as PNG, JPG, WebP, GIF or PDF — Imgkeep".
- **Edge:** 178 users, 0.12.1.
  - The live title is **"Save image as PNG, JPG or WebP - Imgkeep"**, not the one in your brief.
  - The title in the brief, "Imgkeep — Save image as PNG, JPG, WebP, GIF. WebP & AVIF converter", has 65 characters. That is over the 45 MDN gives for Edge, and it's the kind of title Edge rejected on 2026-11-03.
- **Firefox:** 9 daily users, 0.15.1.
  - Title: "Save image as PNG, JPG, WebP, GIF or PDF — Imgkeep".
  - Summary: "Right-click to save any image as PNG, JPG, WebP, GIF or PDF, or get its colour palette. Even photos sites hide from the right-click. Converted on your computer: no uploads, no account."

**How often phrases appear across the 58 unique listings above** (titles / short descriptions):

| Phrase | in titles | in short desc. |
|---|---:|---:|
| webp | 27 | 36 |
| jpg / jpeg | 25 | 38 |
| save image as | 22 | 6 |
| png | 18 | 36 |
| convert / converter | 18 | 28 |
| webp to jpg | 14 | 9 |
| save image as type | 10 | 4 |
| webp to png (incl. "WebP to PNG/JPG", "JPG & PNG") | 7 | 3 |
| pdf | 6 | 10 |
| avif | 3 | 12 |
| gif | 1 | 6 |
| right-click / context menu | 0 | 23 |
| no upload / on your device / locally | 0 | 12 |
| colour palette | 0 | 0 |

## 3. Keyword table

Abbreviations: SC = Search Console, 90 days; Trends = world index (webp to jpg = 100), with the highest of the 5 countries in brackets; AC = appears in a store's autocomplete (C = Chrome, E = Edge, F = Firefox); Titles = competitor titles using it, of 58.

| Phrase | SC impr. / avg. pos. | Trends | AC | Titles | In current Chrome title / summary? | Notes |
|---|---|---|---|---:|---|---|
| webp to jpg | 177 for all WebP queries (e.g. "webp jpg 変換 chrome" 9, pos. 7.2); "save webp as jpg" 4, pos. 83 | 100 (all countries) | C (3× under "jpg"), E ("webp to jpg") | 14 | No / No | **Main gap.** Top demand among Imgkeep's own functions, and a store phrase. |
| webp to png | "webp to png cc relevant" 14, pos. 29.5; "webp in png" 7 | 99 (BR 217, US 156, JP 141) | C ("WEBP to PNG Converter", "WebP to PNG & JPG Converter"), F (as add-on names) | 7 | No / No | Higher than "to JPG" in US, JP, BR and DE; fewer titles use it. |
| save image as | 54 across 28 queries, mostly Spanish ("guardar imagen como" 10, pos. 20.7) | 27 (US 105) | C (most of the "save image" list), E (7 variants), F | 22 | Yes / partly ("save any image as") | The store category's core phrase. Keep it. |
| save image as type | 1–2 per query (e.g. "save image as type chrome", pos. 11) | 4 (US 8) | C (4 of 5 lists, as product names), E (first suggestion), F (as a product name) | 10 | No / No | High store use but tiny on Google. It's also a competitor's product name (100,000 users on Chrome). Not in a title, see section 5. |
| avif / avif to jpg | 86 across 50 queries, none clicked | 37 (US 30, DE 30) | C ("Convert AVIF to JPG", "AVIF to JPG"), E ("avif image converter"), F | 3 | No / No | Real demand, little competition in titles. |
| converter / image converter | — | "webp converter" 28 (BR 225); "image converter extension" 0 | C ("Save As Image Converter", "Bulk Image format Converter"; add-on "Convert and Save Image as"), E ("image converter"), F | 18 | No / No | A word that combines with WebP and AVIF; Brazil searches it heavily. |
| png / jpg (as targets) | — | — | E, F | 18 / 25 | Yes / Yes | Expected in any title; already covered. |
| pdf | 9 (e.g. "chrome extension save as pdf" 5, pos. 43) | not measured | C ("Convert PNG to PDF", "Convert JPG to PDF"), E ("jpg to pdf", "webpage to pdf"; the latter is about pages) | 6 | Yes / Yes | Few competitors offer it, so it's a differentiator. Worth keeping. |
| gif | 1 | not measured | E ("save image as gif") | 1 | Yes / Yes | Little title use. It can move to the summary. |
| right-click | 4 (e.g. "right click isnt working", pos. 7) | not measured | — | 0 | No / Yes | Used in summaries (23), not titles. Keep it in the summary. |
| no upload / on your device | — | not measured | — | 0 | — / Yes | 12 summaries say it, so it's expected now and doesn't stand out. |
| colour palette | 27 over 10 queries, pos. 63 | 2 (US 10) | — | 0 | No / Yes | No measurable demand. It can stay in the long description. |
| png to ico | 326, the largest group, pos. 68.8 | 23 (BR 51) | C ("Favicon Generator – PNG to ICO & Website Icons") | 0 | No / No | Site traffic for the converter page. The extension does ICO only in More options, so it doesn't belong in a store title. |
| png to jpg / jpg to png | 141 for PNG/JPG pairs | 195 | — | — | — | Mostly files on the user's own computer; the site's converter fits that better. Not for the title. |
| image downloader | — | 46 (JP 97) | — | — | — | Bulk downloading, a different job. Using it would mislead. |
| imgkeep (brand) | 0 | not measured | — | — | Yes / — | No brand demand yet. Keep the brand at the end. |

## 4. Gaps in the current listing

1. **"WebP to JPG" / "WebP to PNG"**: the strongest demand Imgkeep actually serves. The current title only reads as "save as WebP".
2. **AVIF**: in neither the Chrome title nor the summary. Real demand, and only 3 competitor titles.
3. **"Convert" / "converter"**: in 18 competitor titles and Edge autocomplete, and a big phrase in Brazil.
4. **The summary spends words on things nobody searches for:**
   - "get its colour palette": Trends 2, no autocomplete.
   - "No personal data": every competitor says something similar.

   That space could go to the WebP and AVIF conversion.

## 5. Limits and policies checked

| Store | Title | Short description | Where it lives | Source |
|---|---|---|---|---|
| Chrome | 75 characters | 132 characters | Manifest `name` and `description`, so **only with a new release**. 51 locales. | developer.chrome.com, Manifest: name, and Manifest: description |
| Edge | **45 (MDN; Edge's own docs give no number)**. Live title is 40. | Same manifest `description` as Chrome (132), because Edge builds from the same package | Package, **new release + certification**. Search terms: 7 max (policy 1.1.4); our listing notes say ≤30 characters each and ≤21 words in total. | learn.microsoft.com publish guide and developer policies; MDN manifest `name` |
| Firefox | **45 (MDN)**. AMO cut a German name at 50 in practice (`scripts/build-firefox.mjs`). | Summary: 250 characters, **editable on AMO without a release** | Name from the package; summary in the AMO Developer Hub | extensionworkshop.com "Create an appealing listing"; MDN |

Policies on misleading or repetitive metadata:
- **Chrome, Keyword Spam:** "irrelevant or excessive keywords" are not allowed. Examples include lists of keywords without added value, and repeating a keyword more than 5 times. The listing guide also says: "Don't stuff the title with keywords" and avoid titles similar to existing extensions.
- **Edge, policy 1.1:** metadata must "accurately and clearly reflect" the extension's functionality.
  - Search terms: at most 7, and relevant.
  - **Imgkeep was already rejected once under 1.1.2** for "excessive search terms" in the title, with five formats.
- **Firefox:** the listing guide says to keep names unique and descriptive, and summaries "as short as possible". The policy page I fetched sets disclosure rules for the name and listing together, which Imgkeep's no-upload wording already meets.

Risks for these options:
- **Similarity to a competitor's name.** "Save Image As Type" is the name of at least four listings, including the 100,000-user leader. A title built around it ("…Save Image As Type") could read as imitation, and you've ruled out competitor names. None of the options use it.
- **Edge certification.** Any Edge title with more than three formats, or format plus "converter" plus more, risks the same 1.1.2 rejection. The Edge options stay short.
- **Repetition.** The options use "JPG" at most twice and stay far under 5 repeats.

## 6. Options

All counts are characters including spaces. Each option only names real features:
- saving as JPG, PNG, GIF and PDF;
- converting WebP and AVIF;
- the right-click menu;
- Alt+S;
- "Find image here" for sites that block saving;
- conversion on the device.

### Chrome (title ≤75, summary ≤132)

| # | Title | Chars | Keywords covered | Why |
|---|---|---:|---|---|
| C1 | Save image as JPG, PNG or PDF: WebP and AVIF converter - Imgkeep | 64 | save image as, jpg, png, pdf, webp, avif, converter | Adds AVIF and "converter" (section 4, gaps 2 and 3) and keeps "save image as". It doesn't say "WebP to JPG" as an exact phrase. |
| **C2** | **Save image as PNG, JPG or PDF, convert WebP to JPG - Imgkeep** | **60** | save image as, **webp to jpg** (exact), png, jpg, pdf, convert | Holds both strongest phrases word for word: the store's core ("save image as", 22 titles) and the top Trend ("webp to jpg", 100, in Edge autocomplete). It loses AVIF, which goes in the summary. |
| C3 | WebP to JPG converter: save image as PNG, JPG or PDF - Imgkeep | 62 | webp to jpg, converter, save image as, png, jpg, pdf | Same phrases as C2 with WebP first. It matches the "webp to jpg" listings, where the leaders have ≤50,000 users. "save image as" moves to the middle. |

| # | Summary | Chars | Keywords covered | Why |
|---|---|---:|---|---|
| S1 | Right-click to save any image as JPG, PNG, GIF or PDF. Converts WebP and AVIF on your device: no uploads, no account. | 117 | right-click, save image as (spread out), jpg, png, gif, pdf, webp, avif, on your device | Adds AVIF and conversion and drops the palette. Stays close to today's wording. |
| **S2** | **Convert WebP and AVIF to JPG or PNG from the right-click menu, or save any image as PDF or GIF. On your device, no uploads.** | **123** | **webp to jpg / png**, avif, convert, right-click, save image as, pdf, gif, no uploads | Leads with the main gap (WebP and AVIF to JPG/PNG), so it complements C2, which leads with "save image as". |
| S3 | Right-click any image to save it as JPG, PNG, GIF or PDF, even on sites that block saving. WebP and AVIF converted locally. | 123 | right-click, jpg, png, gif, pdf, webp, avif, locally | Adds the feature no top-10 summary mentions, sites that block saving (Find image here). It's a differentiator rather than a search phrase. |

### Edge (title ≤45, short description = Chrome's unless `build-edge.mjs` also swaps it)

| # | Title | Chars | Keywords covered | Why |
|---|---|---:|---|---|
| E1 | WebP to JPG and PNG converter - Imgkeep | 39 | webp to jpg, png, converter | The exact Edge autocomplete phrase ("webp to jpg"), and only two formats. It loses "save image as", which the search terms keep. |
| E2 | Save image as JPG or PNG - Imgkeep | 34 | save image as, jpg, png | Matches Edge's "save image as…" suggestions, with the least certification risk. It loses WebP. |
| **E3** | **Save image as PNG, JPG or WebP - Imgkeep** (no change) | **40** | save image as, png, jpg, webp | Already approved under policy 1.1.2. Changing it means a release and another certification, for a store with 178 users. |

| # | Short description | Chars | Notes |
|---|---|---:|---|
| ES1 | = S2 (recommended Chrome summary) | 123 | Automatic: Edge uses the same manifest `description`. |
| ES2 | Save WebP and AVIF images as JPG or PNG from the right-click menu. Also PDF, GIF and colour palettes. No uploads. | 113 | Edge only. It needs `build-edge.mjs` to replace the description as it already replaces the name. |
| ES3 | Right-click to save any image as PNG, JPG, WebP, GIF or PDF, or get its colour palette. On your device. No personal data. | 121 | Today's text, kept. |

**Edge search terms** are the cheap lever here: a listing edit, no package.

Today (21 words):
1. save image as png
2. save image as jpg
3. webp to jpg
4. webp to png
5. image color palette
6. avif to jpg
7. converter

Proposal, still 7 terms and 21 words:
- Replace **"image color palette"** (Trends 2, no autocomplete) with **"image converter"** (Edge autocomplete).
- Replace **"converter"** with **"webp converter"** (Trends 28, Brazil 225; Firefox autocomplete).

### Firefox (name ≤45 to be safe, summary ≤250)

| # | Name | Chars | Keywords covered | Why |
|---|---|---:|---|---|
| F1 | Save image as JPG, PNG or PDF - Imgkeep | 39 | save image as, jpg, png, pdf | Matches the two exact-name "Save Image As" add-ons ranking 1 and 2 on AMO, with real features they don't list. |
| F2 | WebP to JPG and PNG converter - Imgkeep | 39 | webp to jpg, png, converter | For the AMO "webp to jpg" results, where the leader has 308 users. |
| **F3** | **Save image as JPG or PNG, WebP converter** | **40** | save image as, jpg, png, webp, converter | Both themes in 40 characters. It drops "- Imgkeep" because AMO shows the developer name under the title. |

| # | Summary | Chars | Why |
|---|---|---:|---|
| FS1 | Right-click to save any image as JPG, PNG, GIF or PDF. Converts WebP and AVIF to JPG or PNG, even photos that sites hide from the right-click. Converted on your computer: no uploads, no account. | 194 | Close to the live AMO summary, with WebP and AVIF instead of the palette. |
| **FS2** | **Convert WebP and AVIF images to JPG or PNG from the right-click menu, or save any image as PDF, GIF or a colour palette. Works on sites that block saving. No uploads, no account.** | **178** | All the main phrases, the differentiator, and the palette, which costs little in 250 characters. |
| FS3 | Save any image as JPG, PNG, WebP, GIF or PDF with a right-click or Alt+S, and turn WebP and AVIF into files every app opens. Pick the folder and file name. Converted on your computer: no uploads. | 195 | Feature-led and mentions Alt+S, but it's weaker on the exact "WebP to JPG" phrase. |

## 7. Recommendation

| Store | Title | Short description / summary | How it ships |
|---|---|---|---|
| **Chrome** | C2: "Save image as PNG, JPG or PDF, convert WebP to JPG - Imgkeep" | S2 | New release. `extName` and `extDescription` in 51 locales, so the translated names need the same change. |
| **Edge** | E3: keep "Save image as PNG, JPG or WebP - Imgkeep" | ES1 (it follows Chrome's S2 automatically) | Swap the two search terms now (listing edit). The description changes with the next Edge package. |
| **Firefox** | F3: "Save image as JPG or PNG, WebP converter" | FS2 | **Summary first**: an AMO edit, no release, so it's the quickest test. The name follows with the next release. |

Order:
1. The Firefox summary and the Edge search terms first; neither needs a release.
2. The Chrome title and summary with the next release, together with the listing description v11 already drafted.

**What to watch over the following 2–3 weeks:**
- **Chrome Developer Dashboard → Analytics.** Compare the 14 days before and after the release:
  - store listing impressions from search, and page views;
  - install conversion, installs ÷ page views;
  - weekly users (163 today).

  If WebP and AVIF matter in store search, search impressions should rise. If the new title reads better, conversion should rise.
- **Firefox Developer Hub → Statistics:** daily users (9 today) and downloads by source ("search").
- **Edge Partner Center → Analytics:** page views and installs (178 users today). Also check whether the store search for "webp to jpg" puts Imgkeep in the top 20, where it isn't today.
- **Store rank checks.** Rerun the four searches in this report ("save image as" and "webp to jpg" in each store), one week and three weeks after each change, and note Imgkeep's position. The fetch scripts are in the scratchpad and can be kept in the repo if you want.
- **Search Console:** it won't show store searches. Watch the WebP pages' clicks, since the listing and site wording will now match, and branded "imgkeep" queries, which are 0 today. Any brand query would be a sign the store listing is being seen.

Avoid changing several things at once on one store: change the Chrome title and summary together, then leave them alone for 3 weeks so the numbers can be read.

## Appendix: Search Console top 100 queries, 2026-08-27 to 2026-11-24

Groups as in 2.1. Countries and pages show the top two for each query, by impressions.

| # | Query | Group | Impr. | Clicks | CTR | Pos. | Top countries (impr.) | Top pages (impr.) |
|---:|---|---|---:|---:|---:|---:|---|---|
| 1 | png to ico | ICO | 53 | 0 | 0.0% | 56.4 | USA 19, VEN 2 | `/png-to-ico/` 42, `/es/png-to-ico/` 6 |
| 2 | png a ico | ICO | 22 | 0 | 0.0% | 78.7 | ESP 5, COL 5 | `/es/png-to-ico/` 22 |
| 3 | convert png to ico | ICO | 15 | 0 | 0.0% | 57.8 | USA 5, DEU 3 | `/png-to-ico/` 15 |
| 4 | png ico | ICO | 15 | 0 | 0.0% | 75.5 | BRA 3, FRA 2 | `/pt-br/png-to-ico/` 3, `/png-to-ico/` 3 |
| 5 | png to icon | ICO | 15 | 1 | 6.7% | 81.0 | USA 7, CHE 2 | `/png-to-ico/` 15 |
| 6 | webp to png cc relevant | WebP | 14 | 0 | 0.0% | 29.5 | USA 14 | `/webp-to-png/` 14 |
| 7 | конвертировать png в jpg | PNG/JPG | 13 | 0 | 0.0% | 37.7 | USA 9, RUS 2 | `/ru/png-to-jpg/` 13 |
| 8 | png to ico file | ICO | 12 | 0 | 0.0% | 68.3 | USA 4, GBR 4 | `/png-to-ico/` 12 |
| 9 | instead of an accepted image type. | other | 11 | 0 | 0.0% | 71.5 | THA 3, BGD 2 | `/save-image-as-type-alternative/` 11 |
| 10 | guardar imagen como | save image as | 10 | 1 | 10.0% | 20.7 | ESP 5, URY 2 | `/es/` 10, `/es/chrome-saves-images-as-webp/` 3 |
| 11 | avif in jpg | AVIF | 9 | 0 | 0.0% | 58.9 | DEU 9 | `/de/avif-to-jpg/` 9 |
| 12 | avif to jpg | AVIF | 9 | 0 | 0.0% | 55.9 | USA 3, BRA 3 | `/pt-br/avif-to-jpg/` 3, `/avif-to-jpg/` 3 |
| 13 | change png to ico | ICO | 9 | 0 | 0.0% | 73.7 | USA 3, SAU 1 | `/png-to-ico/` 9 |
| 14 | webp jpg 変換 chrome | WebP | 9 | 1 | 11.1% | 7.2 | JPN 9 | `/ja/save-webp-as-jpg-png/` 9 |
| 15 | avif to jpg cc relevant | AVIF | 8 | 0 | 0.0% | 29.5 | USA 8 | `/avif-to-jpg/` 8 |
| 16 | guardar como | save image as | 8 | 0 | 0.0% | 70.6 | ESP 8 | `/es/chrome-saves-images-as-webp/` 6, `/es/save-webp-as-jpg-png/` 4 |
| 17 | is png a jpg? | PNG/JPG | 8 | 0 | 0.0% | 40.4 | IND 8 | `/png-to-jpg/` 8 |
| 18 | convert png to icon | ICO | 7 | 1 | 14.3% | 67.6 | USA 4, DEU 2 | `/png-to-ico/` 7 |
| 19 | webp in png | WebP | 7 | 0 | 0.0% | 56.6 | DEU 5, ITA 2 | `/de/webp-to-png/` 5, `/it/webp-to-png/` 2 |
| 20 | png to ico format | ICO | 6 | 0 | 0.0% | 61.5 | USA 3, GBR 2 | `/png-to-ico/` 6 |
| 21 | save webp as gif | WebP | 6 | 1 | 16.7% | 25.3 | USA 3, SGP 1 | `/save-animated-webp-as-gif/` 6 |
| 22 | apply color palette to image | palette | 5 | 0 | 0.0% | 69.8 | USA 5 | `/color-palette-from-image/` 5 |
| 23 | chrome extension save as pdf | PDF | 5 | 0 | 0.0% | 43.4 | USA 5 | `/save-image-as-pdf/` 5 |
| 24 | color palette from image | palette | 5 | 0 | 0.0% | 68.8 | IND 3, NLD 1 | `/color-palette-from-image/` 5 |
| 25 | convert png file to icon | ICO | 5 | 0 | 0.0% | 38.0 | NLD 5 | `/png-to-ico/` 5 |
| 26 | gabfmnliflodkdafenbcpjdlppllnemd | extension ID | 5 | 0 | 0.0% | 7.8 | ISR 2, UKR 1 | `/save-image-as-type-alternative/` 5 |
| 27 | guardar png | save image as | 5 | 0 | 0.0% | 50.8 | ESP 5 | `/es/` 4, `/es/save-webp-as-jpg-png/` 1 |
| 28 | how to change png to jpg | PNG/JPG | 5 | 0 | 0.0% | 53.6 | USA 5 | `/png-to-jpg/` 5 |
| 29 | png to ico converter | ICO | 5 | 1 | 20.0% | 58.2 | USA 3, CHE 1 | `/png-to-ico/` 5 |
| 30 | png to icon converter | ICO | 5 | 0 | 0.0% | 67.6 | USA 2, MYS 1 | `/png-to-ico/` 5 |
| 31 | webp animation | WebP | 5 | 0 | 0.0% | 92.0 | USA 4, GBR 1 | `/save-animated-webp-as-gif/` 5 |
| 32 | webp png 変換 chrome | WebP | 5 | 0 | 0.0% | 7.0 | JPN 5 | `/ja/save-webp-as-jpg-png/` 5 |
| 33 | как сохранить изображение не в webp | WebP | 5 | 0 | 0.0% | 35.2 | IND 4, BRA 1 | `/ru/save-webp-as-jpg-png/` 3, `/ru/chrome-saves-images-as-webp/` 3 |
| 34 | конвертер png в ico | ICO | 5 | 0 | 0.0% | 51.2 | USA 4, UKR 1 | `/ru/png-to-ico/` 5 |
| 35 | convertir png a ico | ICO | 4 | 0 | 0.0% | 84.2 | ESP 3, COL 1 | `/es/png-to-ico/` 4 |
| 36 | de png a ico | ICO | 4 | 0 | 0.0% | 76.5 | ESP 2, VEN 1 | `/es/png-to-ico/` 4 |
| 37 | extension guardar imagen como | save image as | 4 | 0 | 0.0% | 27.5 | BRA 2, COL 1 | `/pt-br/save-webp-as-jpg-png/` 1, `/pt-br/chrome-saves-images-as-webp/` 1 |
| 38 | png a icon | ICO | 4 | 0 | 0.0% | 78.2 | PER 2, ESP 1 | `/es/png-to-ico/` 4 |
| 39 | png ico converter | ICO | 4 | 0 | 0.0% | 86.2 | FRA 2, KEN 1 | `/fr/png-to-ico/` 2, `/png-to-ico/` 1 |
| 40 | png jpg jpeg gif | PNG/JPG | 4 | 0 | 0.0% | 66.5 | ESP 4 | `/es/` 4 |
| 41 | save webp as jpg | WebP | 4 | 0 | 0.0% | 83.0 | USA 2, GBR 1 | `/save-webp-as-jpg-png/` 4, `/webp-to-jpg/` 1 |
| 42 | transformer png en ico | ICO | 4 | 0 | 0.0% | 79.5 | FRA 4 | `/fr/png-to-ico/` 4 |
| 43 | webp gifs | WebP | 4 | 0 | 0.0% | 77.5 | USA 1, ITA 1 | `/save-animated-webp-as-gif/` 4 |
| 44 | webp לתמונות | WebP | 4 | 0 | 0.0% | 59.2 | ISR 4 | `/he/webp-to-png/` 4, `/he/chrome-saves-images-as-webp/` 4 |
| 45 | конвертировать пнг в джипег | PNG/JPG | 4 | 0 | 0.0% | 7.2 | USA 4 | `/ru/png-to-jpg/` 4 |
| 46 | avif jpg | AVIF | 3 | 0 | 0.0% | 74.3 | FRA 2, JPN 1 | `/fr/avif-to-jpg/` 2, `/ja/avif-to-jpg/` 1 |
| 47 | avif zu jpg | AVIF | 3 | 0 | 0.0% | 54.0 | DEU 3 | `/de/avif-to-jpg/` 3 |
| 48 | colour palette from image | palette | 3 | 0 | 0.0% | 86.3 | IND 2, GBR 1 | `/color-palette-from-image/` 3 |
| 49 | convert png file to ico | ICO | 3 | 0 | 0.0% | 74.3 | USA 1, MAR 1 | `/png-to-ico/` 3 |
| 50 | converter avif para jpg | AVIF | 3 | 0 | 0.0% | 78.0 | BRA 3 | `/pt-br/avif-to-jpg/` 3 |
| 51 | convertisseur png ico | ICO | 3 | 0 | 0.0% | 84.7 | FRA 2, PHL 1 | `/fr/png-to-ico/` 2, `/png-to-ico/` 1 |
| 52 | gif saving as webp | WebP | 3 | 0 | 0.0% | 20.3 | USA 2, GBR 1 | `/save-animated-webp-as-gif/` 3 |
| 53 | how to download webp | WebP | 3 | 0 | 0.0% | 62.7 | USA 1, GBR 1 | `/save-webp-as-jpg-png/` 3 |
| 54 | how to save a webp as a jpeg | WebP | 3 | 0 | 0.0% | 85.0 | USA 2, PAK 1 | `/save-webp-as-jpg-png/` 3 |
| 55 | how to save webp as gif | WebP | 3 | 0 | 0.0% | 15.7 | UKR 1, MYS 1 | `/save-animated-webp-as-gif/` 3 |
| 56 | how to save webp as jpg | WebP | 3 | 0 | 0.0% | 85.3 | USA 2, GBR 1 | `/save-webp-as-jpg-png/` 3 |
| 57 | png a icono | ICO | 3 | 0 | 0.0% | 84.3 | ESP 1, CHL 1 | `/es/png-to-ico/` 3 |
| 58 | png and jpg | PNG/JPG | 3 | 0 | 0.0% | 28.3 | ARE 3 | `/png-to-jpg/` 3 |
| 59 | png converter ico | ICO | 3 | 0 | 0.0% | 58.3 | NLD 1, FRA 1 | `/png-to-ico/` 1, `/fr/png-to-ico/` 1 |
| 60 | png for ico | ICO | 3 | 0 | 0.0% | 94.7 | AUS 2, ESP 1 | `/png-to-ico/` 2, `/es/png-to-ico/` 1 |
| 61 | png to icon file converter | ICO | 3 | 0 | 0.0% | 34.3 | SWE 2, GBR 1 | `/png-to-ico/` 3 |
| 62 | png to icon format | ICO | 3 | 0 | 0.0% | 75.0 | MYS 1, MAR 1 | `/png-to-ico/` 3 |
| 63 | png в jpg | PNG/JPG | 3 | 0 | 0.0% | 46.0 | UKR 1, RUS 1 | `/ru/png-to-jpg/` 3, `/uk/png-to-jpg/` 1 |
| 64 | pngからjpg | PNG/JPG | 3 | 0 | 0.0% | 75.0 | JPN 3 | `/ja/png-to-jpg/` 3 |
| 65 | portable network graphics image to jpg | PNG/JPG | 3 | 0 | 0.0% | 81.3 | FRA 2, USA 1 | `/png-to-jpg/` 3 |
| 66 | save webp as gif extension | WebP | 3 | 0 | 0.0% | 7.3 | PHL 1, LKA 1 | `/save-animated-webp-as-gif/` 3 |
| 67 | seletor de cores online a partir de imagem | palette | 3 | 0 | 0.0% | 64.3 | BRA 3 | `/pt-br/color-palette-from-image/` 3 |
| 68 | transfer png to ico | ICO | 3 | 0 | 0.0% | 88.0 | USA 1, PHL 1 | `/png-to-ico/` 3 |
| 69 | transform png to ico | ICO | 3 | 0 | 0.0% | 93.0 | TUR 1, SAU 1 | `/png-to-ico/` 3 |
| 70 | transformar webp em png | WebP | 3 | 0 | 0.0% | 81.7 | BRA 3 | `/pt-br/webp-to-png/` 3 |
| 71 | turn png into icon | ICO | 3 | 0 | 0.0% | 66.7 | PHL 1, EGY 1 | `/png-to-ico/` 3 |
| 72 | как сохранить картинку webp | WebP | 3 | 0 | 0.0% | 28.3 | BRA 2, BGD 1 | `/ru/save-webp-as-jpg-png/` 2, `/ru/chrome-saves-images-as-webp/` 1 |
| 73 | пнг в джипег | PNG/JPG | 3 | 0 | 0.0% | 62.0 | UKR 1, KAZ 1 | `/ru/png-to-jpg/` 3 |
| 74 | צבעים לאתר | palette | 3 | 0 | 0.0% | 7.3 | ISR 3 | `/he/color-palette-from-image/` 3 |
| 75 | 画像 カラーパレット | palette | 3 | 0 | 0.0% | 47.3 | JPN 3 | `/ja/color-palette-from-image/` 3 |
| 76 | .png to .ico | ICO | 2 | 0 | 0.0% | 57.0 | USA 1, GBR 1 | `/png-to-ico/` 2 |
| 77 | animated webp | WebP | 2 | 0 | 0.0% | 82.0 | KOR 1, GBR 1 | `/save-animated-webp-as-gif/` 2 |
| 78 | arquivo avif para png | AVIF | 2 | 0 | 0.0% | 41.0 | BRA 2 | `/pt-br/save-avif-as-jpg-png/` 2 |
| 79 | avif para jpg | AVIF | 2 | 0 | 0.0% | 91.0 | BRA 2 | `/pt-br/avif-to-jpg/` 2 |
| 80 | avif para png | AVIF | 2 | 0 | 0.0% | 46.5 | BRA 2 | `/pt-br/save-avif-as-jpg-png/` 2 |
| 81 | avif to jpeg | AVIF | 2 | 0 | 0.0% | 38.5 | USA 2 | `/avif-to-jpg/` 2 |
| 82 | change a png to ico | ICO | 2 | 0 | 0.0% | 63.5 | USA 2 | `/png-to-ico/` 2 |
| 83 | change png into ico | ICO | 2 | 0 | 0.0% | 81.5 | USA 1, NLD 1 | `/png-to-ico/` 2 |
| 84 | client side image converter | other | 2 | 0 | 0.0% | 96.5 | USA 2 | `/convert/` 2 |
| 85 | conversor de png para jpg | PNG/JPG | 2 | 0 | 0.0% | 93.5 | BRA 2 | `/pt-br/png-to-jpg/` 2 |
| 86 | convert a png to an icon | ICO | 2 | 0 | 0.0% | 87.5 | USA 2 | `/png-to-ico/` 2 |
| 87 | convert png ico | ICO | 2 | 0 | 0.0% | 89.5 | ESP 1, DEU 1 | `/es/png-to-ico/` 1, `/de/png-to-ico/` 1 |
| 88 | convert png to ico format | ICO | 2 | 0 | 0.0% | 97.0 | USA 1, ARE 1 | `/png-to-ico/` 2 |
| 89 | converter png ico | ICO | 2 | 0 | 0.0% | 83.0 | ITA 1, BRA 1 | `/pt-br/png-to-ico/` 1, `/it/png-to-ico/` 1 |
| 90 | converter png para ico | ICO | 2 | 0 | 0.0% | 77.0 | BRA 2 | `/pt-br/png-to-ico/` 2 |
| 91 | converter webp em png | WebP | 2 | 0 | 0.0% | 92.0 | BRA 2 | `/pt-br/webp-to-png/` 2 |
| 92 | convertir png en favicon | ICO | 2 | 0 | 0.0% | 16.5 | FRA 2 | `/fr/png-to-ico/` 2 |
| 93 | convertire file png in jpg gratis | PNG/JPG | 2 | 0 | 0.0% | 41.0 | ITA 2 | `/it/png-to-jpg/` 2 |
| 94 | convertire png in jpeg | PNG/JPG | 2 | 0 | 0.0% | 57.0 | ITA 2 | `/it/png-to-jpg/` 2 |
| 95 | da png a ico | ICO | 2 | 0 | 0.0% | 70.0 | ITA 2 | `/it/png-to-ico/` 2 |
| 96 | da png a jpg | PNG/JPG | 2 | 0 | 0.0% | 81.5 | ITA 2 | `/it/png-to-jpg/` 2 |
| 97 | give color palette from image | palette | 2 | 0 | 0.0% | 64.0 | USA 2 | `/color-palette-from-image/` 2 |
| 98 | guardar imagen como jpg/png/webp | WebP | 2 | 0 | 0.0% | 68.5 | KEN 1, ARG 1 | `/es/save-webp-as-jpg-png/` 2, `/es/chrome-saves-images-as-webp/` 1 |
| 99 | how to change avif to jpg | AVIF | 2 | 0 | 0.0% | 81.5 | USA 2 | `/avif-to-jpg/` 2 |
| 100 | how to change from png to jpg | PNG/JPG | 2 | 0 | 0.0% | 45.5 | USA 2 | `/png-to-jpg/` 2 |
