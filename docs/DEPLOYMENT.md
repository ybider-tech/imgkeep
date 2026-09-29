# Deployment

How Imgkeep was set up the first time (all done by 2026-09-26). Kept as a record and for rebuilding from scratch. For regular releases, see "Releasing a new version" in the [README](../README.md).

## 1. Git and GitHub

```bash
git init -b main
git add -A
git commit -m "Imgkeep 0.3.0"
gh repo create imgkeep --public --source=. --remote=origin --push
```

## 2. GitHub Pages from `site/`

The workflow `.github/workflows/pages.yml` publishes `site/` on every push to `main` that changes it.

```bash
gh api -X POST repos/<github-user>/imgkeep/pages -f build_type=workflow
gh workflow run "Deploy site"
gh api -X PUT repos/<github-user>/imgkeep/pages -f cname=imgkeep.app
```

With workflow deploys, GitHub uses the domain set in the repo settings (the `site/CNAME` file documents it). After DNS works and GitHub has issued the certificate (can take up to an hour):

```bash
gh api -X PUT repos/<github-user>/imgkeep/pages -F https_enforced=true
```

Or in the browser: repo **Settings → Pages**: Source **GitHub Actions**, Custom domain `imgkeep.app`, tick **Enforce HTTPS**.

## 3. DNS for imgkeep.app (GoDaddy)

Remove any existing `@` A records (the registrar's parking page) and add:

| Type | Name | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | `<github-user>.github.io` |

Check with `dig +short imgkeep.app` and `dig +short www.imgkeep.app`.

## 4. Chrome Web Store

1. `sh scripts/package.sh` → `dist/imgkeep-<version>.zip`.
2. Sign in to the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/devconsole). Account type: **Non-trader**.
3. **New item** → upload `dist/imgkeep-<version>.zip`.
4. **Store listing**: paste from `store/listing.md` (description, category Tools, language English). Upload `extension/icons/icon128.png`, the four `store/screenshot-*.png` files, `store/promo-tile-440x280.png` and `store/marquee-1400x560.png`.
5. **Privacy practices**: single purpose, each permission justification, remote code "No", data usage "none", tick all three certifications (all in `store/listing.md`). Privacy policy URL `https://imgkeep.app/privacy.html`.
6. **Distribution**: Public, all regions, free.
7. **Submit for review**.

Imgkeep is live at https://chromewebstore.google.com/detail/fkclfgbmjaafglfifenonfcahfdmajbl. The site's **Add to Chrome — free** button and the structured data use this ID-based link, which keeps working if the listing name changes.

## 5. Microsoft Edge Add-ons

The same zip works in Edge. Everything to paste is in `store/edge-listing.md`, and the 300×300 store logo is `store/edge-logo-300.png` (made by `npm run icons`).

1. Register (free) at https://partner.microsoft.com/dashboard/microsoftedge/public/login with a Microsoft account.
2. **Create new extension** → upload `dist/imgkeep-<version>.zip`.
3. Fill in Availability (Public, all markets), Properties, Store listing and Submission notes from `store/edge-listing.md`, then **Publish**. Review takes up to 7 business days.
