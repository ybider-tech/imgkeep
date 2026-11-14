# Phase 1 plan: "never fails" and provable trust

Written 2026-11-13 from `PLAN.md` and `docs/ARCHITECTURE.md` (decisions A–F there still apply). Plan only: nothing here is built.
Every release follows the existing flow: `release/x.y.z` branch, announce first when privacy or permissions
change, Yaron's OK before any push or store submission.

## Findings that shape the plan

- **Page access is limited.** The menu click gives the extension only the image address. Reading `srcset`, `alt`
  or `title` needs optional `scripting`, which exists only for Find image here and for allowed sites. So the
  resolver (1.2) can use CDN rules everywhere but page parsing only where Find already works, and the `{title}` /
  `{alt}` file-name tokens (1.8) are limited the same way.
- **Alt+S (1.10) fits the "nothing runs on pages by itself" promise.** A keyboard shortcut or toolbar click grants
  `activeTab` for that moment; the finder can then run, and `:hover` is accurate because the pointer has not left
  the image (the stale-pointer problem of the context-menu path does not apply). It also saves images on
  right-click-blocked sites, where the browser menu never opens.
- **Cookie-protected images may need a fetch from inside the page.** An extension fetch with
  `credentials: "include"` may not send `SameSite=Lax` cookies. Test against the cookie fixture first; if it
  fails, reuse the `read-blob.js` mechanism (inject, fetch in the page, return bytes) on an allowed site.
- **The Referer rule needs one prompt, not two.** One `permissions.request` can ask for
  `declarativeNetRequestWithHostAccess` and the site together, extending the existing "Allow Imgkeep to get
  images from this site?" window. Scope the session rule with `tabIds: [-1]` (only the extension's own fetches,
  never the page's), give each job its own rule id, remove it in a `finally`.
- **CDN rules must not add prompts.** The "original" URL often sits on another host. Fetch it only if that
  already works (CORS-open, or the host already allowed); otherwise fall back silently to the clicked URL.

## Order and releases

Step 0 ranks the work by real failure data (anonymous counts in PostHog) before anything is built.

| Release | Contents | Gate |
|---|---|---|
| 0.12.1 (built, unreleased) | + 1.17 rating threshold (5 uses, 2 days), Copy as PNG fix | none new |
| 0.13.0 "Protected sites" | 1.1 fetch ladder (steps 2 and 3), stricter validation, "Report site" link | announce first: new optional permission, new network wording |
| 0.14.0 "Original size" | 1.2 resolver and CDN rules with an Options toggle; 1.8 tokens | announce first: "or its full-size version on the same site" |
| 0.15.0 "Control" | 1.10 Alt+S and toolbar path, 1.3 extension, 1.5 APNG and animation hint, 1.6 AVIF slider | none |
| Trust track (parallel; CI and docs) | 1.11, 1.13, `VERIFY.md`; 1.12 Options additions ship with a later extension release | Yaron writes or approves the pledge wording |

## Task detail

- **1.1 Fetch ladder** (`lib/fetch-ladder.js`, called from `offscreen.js`).
  A: today's fetch with strict validation (magic bytes, decodable, more than 0 bytes). B: retry with the Referer
  session rule after the optional permission. C: fetch inside the page for cookie sites, on an allowed site only.
  The two `test.fixme` entries in `tests/fixtures.spec.mjs` become real tests as steps land. Which step won is
  logged locally only. A failed save offers "Report site": a prefilled GitHub issue the user reviews and sends.
- **1.2 Resolver** (`lib/resolve-best.js`, `lib/cdn-rules.js`; plain JS, no build step). One table-driven rule per
  CDN: Twitter/X, Pinterest, Shopify, WordPress, Etsy, Reddit, Unsplash/Imgix. Check each rule once against a live
  example, test with synthetic URLs. Falls back to the clicked URL if the original fails. Options toggle.
- **1.8 Tokens.** Add `{n}`, `{site}`, `{original}`. `{title}` and `{alt}` fill only when the page was readable,
  empty otherwise (the existing empty-token handling already copes).
- **1.10 Alt+S** via `commands` (no permission); saves in the last-used format; uses the optional `activeTab` +
  `scripting` that Find image here already asks for.
- **1.5 Animation.** APNG output (pure JS, no WASM). A "this was animated, saved the first frame" note with a
  one-click GIF/APNG save, using the existing notice mechanism (check what it is first). Animated WebP output deferred.
- **1.6 Quality.** AVIF quality slider.
- **1.11 Reproducible builds.** `scripts/pack.mjs` with sorted entries, fixed dates and fixed compression, replacing
  `zip -X`. A test that two builds are byte-identical; CI checks Linux and Windows agree. A tag-triggered release
  job publishes the three zips plus `SHA256SUMS`. `docs/VERIFY.md` must say stores re-sign packages, so compare
  unpacked files, not zips.
- **1.12 Trust.** A `build.json` (commit, per-file SHA-256) shown in Options with a link to the release.
- **1.13 Permission-change check.** CI script compares the manifest with the last tag and fails if a permission
  (install-time or optional) grew without a CHANGELOG "Permission changes" entry.
- **Strings.** Every new user-facing string goes into 50 locales in-session; keep new strings few.
- **Tests.** Unit-level checks run in Playwright like the existing `settings.spec.mjs`; E2E uses the fixture pages.

## Deferred

- **Screenshot fallback (1.1 step 4):** partial, lower-quality output; contradicts "no blurry output" and "never
  changes a page". Skip, or later as an explicit "Save what's on screen" button, never automatic.
- **JXL and HEIC (1.4):** each adds 1–2 MB of WASM, and libheif has licensing to check. Only on demand, as AVIF was.
- **Lossless default (1.6):** changes today's output for existing users; needs Yaron's OK.

## Step 0: what the anonymous counts say (PostHog, last 60 days, read 2026-11-13)

Method: the weekly digest's deduplicated daily summaries, excluding debug copies. Counts only; anonymous, so
nothing can be normalised per install.

- **Overall:** 16,329 saves, 371 failures (2.2%). By kind: `fail_blocked` 236, `fail_http` 68, `fail_copy` 32,
  `fail_blob` 30, the rest 5. `fail_blocked` is only counted when the site was already allowed (a not-yet-allowed
  site counts as `site_access_asked`), so it means the fetch failed even with access.
- **One cohort dominates.** Edge on 0.9.0 has 2,764 of 2,974 summaries, 14,504 of the saves, and 218 of the
  `blocked`, all 68 `http` and 26 of the `blob` failures. Edge's store count was about 13 users in October, so this
  needs explaining (a few heavy users, an old build, or something else). Until it is, the totals say little.
- **Current builds on Chrome (0.10.2 to 0.12.0):** about 2,400 saves and only 14 `blocked` failures (about 0.6%),
  0 `http`. Weekly save-failure rate (excluding copy and blob) is 0.5% to 2.1%, rising only because of that cohort.
- **Hotlink demand is not proven by the data.** `fail_http` mixes 403 (hotlink) with 404 and is 0 on every build
  after 0.9.0. The qualitative evidence stands: competitor reviews, and two uninstall answers "it didn't work on a
  site I needed".
- **The biggest friction is the site question, not failure.** 887 asks (about 5% of saves), 832 allowed (94%), so
  about 55 saves were lost to a refusal. The fetch ladder does not change that.
- **Copy as PNG fails 16%:** `fail_copy` 32 against 198 copies, all on Chrome 0.12.0. Not a Phase 1 item, but it
  breaks "never fails" and is probably a bug. Worth a look first.

Consequences for the order:

1. Look into the `fail_copy` rate before anything else (a possible 0.12.1 fix).
2. Add small count keys so the next numbers can rank the work: the HTTP status class of a failure
   (`fail_http_403`, `fail_http_404`, `fail_http_other`) and which ladder step won. Counts only, no addresses;
   announced in the privacy policy first (this is open decision 4).
3. Keep 1.1 in 0.13.0, but scope it to what the evidence supports: the Referer retry first, the in-page cookie
   fetch only if the cookie fixture shows the extension fetch really lacks the cookie.
4. Treat the fixture-based tests as the proof for these cases until real counts exist.

## Update 2026-11-14

0.12.1 submitted to the three stores; 0.13.0 built (Referer retry, new counts). "Report site" skipped for 0.13.0: revisit
in 0.14.0 with host-only pre-fill if the new `fail_http_403` counts show hotlinking matters.

## Decisions (Yaron, 2026-11-13: "go with your suggestions on all four")

1. Screenshot fallback: **skipped.** It stays out; at most a later, explicit "Save what's on screen" button.
2. "Original size" toggle (1.2): **off by default**, so existing users' files don't change; Options toggle, announced in What's new.
3. Rating threshold: **5 uses and 2 days** (done in 0.12.1, `lib/review.js`, tests and README updated).
4. New anonymous count keys: **yes**: `fail_http_403`, `fail_http_404`, `fail_http_other` and the winning ladder step.
   Added in 0.13.0 with the privacy policy updated first.
5. Merge `chore/phase-0` to `main`: done and pushed (2026-11-13).

Still open: why the Edge 0.9.0 cohort is so large (Step 0), and whether the Copy as PNG fix (0.12.1) brings `fail_copy` down.
