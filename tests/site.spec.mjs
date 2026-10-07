// The website: pages load without console errors, and privacy.html says what PRIVACY.md says.
import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { startServer } from "./servers.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let server;

test.beforeAll(async () => {
  server = await startServer({ cors: false, root: join(ROOT, "site") });
});
test.afterAll(() => server?.close());

// Guide pages live in folders and are served (and canonical) at their folder URL, with a trailing slash.
const GUIDES = ["chrome-saves-images-as-webp", "save-webp-as-jpg-png", "save-avif-as-jpg-png", "save-image-as-type-alternative"];
const STORE = "https://chromewebstore.google.com/detail/fkclfgbmjaafglfifenonfcahfdmajbl";
// Every page as [URL path, file under site/].
const PAGES = [
  ...["index.html", "privacy.html", "support.html", "ideas.html", "pro.html", "whats-new.html", "404.html"].map((f) => [f, f]),
  ...GUIDES.map((g) => [`${g}/`, `${g}/index.html`]),
];

for (const [page] of PAGES) {
  test(`${page} opens with no console errors`, async ({ page: tab }) => {
    const errors = [];
    tab.on("pageerror", (e) => errors.push(e.message));
    tab.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    tab.on("requestfailed", (r) => errors.push(`${r.url()} ${r.failure()?.errorText}`));
    // Everything, fonts included, must come from the site itself: no third-party requests.
    const outside = [];
    tab.on("request", (r) => !r.url().startsWith(server.url) && !r.url().startsWith("data:") && outside.push(r.url()));
    const res = await tab.goto(`${server.url}/${page}`, { waitUntil: "networkidle" });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/html");
    await tab.evaluate(() => document.fonts.ready);
    expect(outside).toEqual([]);
    await expect(tab.locator("h1")).toHaveCount(1);
    await expect(tab.locator("h1")).toBeVisible();
    expect(await tab.getAttribute("html", "lang")).toBe("en");
    expect(await tab.locator('meta[name="description"]').count()).toBe(1);
    expect(errors).toEqual([]);
  });
}

test("privacy.html matches PRIVACY.md", async ({ page }) => {
  const md = await readFile(join(ROOT, "extension", "PRIVACY.md"), "utf8");
  await page.goto(`${server.url}/privacy.html`);
  const html = (await page.locator("main").innerText()).replace(/\s+/g, " ");
  const lines = md.split("\n").map((l) => l.replace(/^#+\s*/, "").trim()).filter(Boolean);
  for (const line of lines) expect(html, `missing: ${line}`).toContain(line.replace(/\s+/g, " "));
});

test("no analytics or trackers on the site", async () => {
  for (const [, file] of PAGES) {
    const raw = await readFile(join(ROOT, "site", file), "utf8");
    expect(raw).not.toMatch(/gtag\(|googletagmanager|google-analytics|plausible\.io|segment\.com|hotjar|clarity\.ms/i);
    // Deliberate, narrow exception: JSON-LD structured data (<script type="application/ld+json">) is
    // data, not code. Browsers never execute it. It must parse as JSON; every other <script> still fails.
    const html = raw.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (_, json) => {
      expect(() => JSON.parse(json), `${file}: invalid JSON-LD`).not.toThrow();
      return "";
    });
    expect(html).not.toMatch(/<script/i);
  }
});

test("ideas page links to the GitHub Ideas board, and every page links to it", async () => {
  const ideas = await readFile(join(ROOT, "site", "ideas.html"), "utf8");
  expect(ideas).toContain("https://github.com/ybider-tech/imgkeep/discussions/new?category=ideas");
  expect(ideas).toContain("https://github.com/ybider-tech/imgkeep/discussions/categories/ideas");
  for (const file of ["index.html", "privacy.html", "support.html"]) {
    expect(await readFile(join(ROOT, "site", file), "utf8")).toContain('href="ideas.html"');
  }
});

// SEO basics: every indexable page has its own title and description, a canonical URL,
// Open Graph tags, and is listed in sitemap.xml, which robots.txt points to.
test("SEO tags, sitemap and robots.txt are consistent", async () => {
  const pages = { "index.html": "https://imgkeep.app/", "privacy.html": "https://imgkeep.app/privacy.html",
    "support.html": "https://imgkeep.app/support.html", "ideas.html": "https://imgkeep.app/ideas.html",
    "pro.html": "https://imgkeep.app/pro.html", "whats-new.html": "https://imgkeep.app/whats-new.html",
    ...Object.fromEntries(GUIDES.map((g) => [`${g}/index.html`, `https://imgkeep.app/${g}/`])) };
  const sitemap = await readFile(join(ROOT, "site", "sitemap.xml"), "utf8");
  const robots = await readFile(join(ROOT, "site", "robots.txt"), "utf8");
  expect(robots).toContain("Sitemap: https://imgkeep.app/sitemap.xml");
  expect(robots).not.toMatch(/Disallow:\s*\/\s*$/m);
  const titles = new Set(), descriptions = new Set();
  for (const [file, url] of Object.entries(pages)) {
    const html = await readFile(join(ROOT, "site", file), "utf8");
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)">/)?.[1];
    expect(title, file).toBeTruthy();
    expect(title.length, `${file} title length`).toBeLessThanOrEqual(60);
    expect(description.length, `${file} description length`).toBeLessThanOrEqual(160);
    titles.add(title); descriptions.add(description);
    expect(html).toContain(`<link rel="canonical" href="${url}">`);
    expect(html).toContain(`<meta property="og:url" content="${url}">`);
    for (const tag of ["og:title", "og:description", "og:image"]) expect(html, `${file} ${tag}`).toContain(`property="${tag}"`);
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).not.toMatch(/name="robots" content="[^"]*noindex/);
    expect(sitemap, `${url} in sitemap`).toContain(`<loc>${url}</loc>`);
  }
  expect(titles.size).toBe(Object.keys(pages).length);
  expect(descriptions.size).toBe(Object.keys(pages).length);
  expect(sitemap.match(/<loc>/g).length).toBe(Object.keys(pages).length);
  expect(await readFile(join(ROOT, "site", "404.html"), "utf8")).toContain('<meta name="robots" content="noindex">');
});

test("self-hosted fonts load, and the home page leads with what Imgkeep does", async ({ page }) => {
  await page.goto(`${server.url}/index.html`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() => [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family.replace(/"/g, "")));
  expect(loaded).toEqual(expect.arrayContaining(["Schibsted Grotesk", "Source Sans 3"]));
  await expect(page.locator("h1")).toHaveText("Save any image as PNG, JPG or WebP");
  await expect(page.locator(".kicker")).toHaveText("Right format. Right folder. Nothing else.");
});

test("Add to Chrome points to the live store listing", async ({ page }) => {
  await page.goto(`${server.url}/index.html`);
  await expect(page.locator("#install")).toHaveAttribute("href", STORE);
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const ld = blocks.map((b) => JSON.parse(b)).find((d) => d["@type"] === "SoftwareApplication");
  expect(ld.installUrl).toBe(STORE);
  // No page may link to "#" as a placeholder any more.
  for (const [, file] of PAGES) {
    expect(await readFile(join(ROOT, "site", file), "utf8")).not.toMatch(/href="#"/);
  }
});

test("guide pages: one tagged store link each, linked to each other, from home and from support", async ({ page }) => {
  for (const guide of GUIDES) {
    await page.goto(`${server.url}/${guide}/`);
    const store = page.locator(`a[href^="${STORE}"]`);
    await expect(store, `${guide}: one store link`).toHaveCount(1);
    await expect(store).toHaveAttribute("href", `${STORE}?utm_source=imgkeep.app&utm_medium=landing&utm_campaign=${guide}`);
    await expect(page.locator('main a[href="../"], header a[href="../"]').first()).toBeVisible();
    for (const other of GUIDES.filter((g) => g !== guide)) {
      expect(await page.locator(`main a[href="../${other}/"]`).count(), `${guide} links to ${other}`).toBeGreaterThan(0);
    }
    // Relative links must resolve: every same-site link on the page returns 200.
    const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.href).filter((h) => h.startsWith(location.origin)));
    for (const href of new Set(hrefs)) expect((await page.request.get(href)).status(), href).toBe(200);
  }
  for (const file of ["index.html", "support.html"]) {
    await page.goto(`${server.url}/${file}`);
    for (const guide of GUIDES) await expect(page.locator(`a[href="${guide}/"]`), `${file} links to ${guide}`).toHaveCount(1);
  }
});

test("guides have a visible way back to the home page", async ({ page }) => {
  for (const slug of GUIDES) {
    await page.goto(`${server.url}/${slug}/`);
    const home = page.locator('nav.crumbs a', { hasText: "Home" });
    await expect(home).toBeVisible();
    await home.click();
    await expect(page.locator("h1")).toHaveText("Save any image as PNG, JPG or WebP");
  }
});

test("every page loads the current stylesheet version (run npm run version-css after editing style.css)", async () => {
  const { cssVersion, htmlFiles } = await import("../scripts/version-css.mjs");
  const v = await cssVersion();
  for (const file of await htmlFiles()) {
    const html = await readFile(file, "utf8");
    const refs = [...html.matchAll(/href="(?:\/|(?:\.\.\/)*)style\.css([^"]*)"/g)].map((m) => m[1]);
    expect(refs, file).toEqual([`?v=${v}`]);
  }
});

test("the rating link lives only on Support and Ideas, never as a pop-up or on other pages", async () => {
  const REVIEWS = "https://chromewebstore.google.com/detail/fkclfgbmjaafglfifenonfcahfdmajbl/reviews";
  for (const file of ["support.html", "ideas.html"]) {
    const html = await readFile(join(ROOT, "site", file), "utf8");
    expect(html.split(REVIEWS).length - 1, file).toBe(1);
  }
  for (const file of ["index.html", "privacy.html", "404.html", "chrome-saves-images-as-webp/index.html", "save-webp-as-jpg-png/index.html", "save-avif-as-jpg-png/index.html", "save-image-as-type-alternative/index.html"]) {
    expect(await readFile(join(ROOT, "site", file), "utf8"), file).not.toContain("/reviews");
  }
});

test("home page demo video: poster first, loads only on play, with a YouTube fallback", async ({ page }) => {
  const requests = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.goto(`${server.url}/index.html`, { waitUntil: "networkidle" });
  const video = page.locator("figure.video video");
  await expect(video).toHaveAttribute("preload", "none");
  expect(await video.getAttribute("autoplay")).toBeNull();
  // The poster is shown (and is the fallback where WebM can't play); the video file isn't fetched until play.
  expect(requests.some((u) => u.endsWith("/media/imgkeep-demo-poster.jpg"))).toBe(true);
  expect(requests.some((u) => u.endsWith("/media/imgkeep-demo.webm"))).toBe(false);
  await expect(page.locator("figure.video video source")).toHaveAttribute("type", "video/webm");
  for (const file of ["media/imgkeep-demo.webm", "media/imgkeep-demo-poster.jpg"]) {
    const res = await page.request.get(`${server.url}/${file}`);
    expect(res.status(), file).toBe(200);
  }
  await expect(page.locator("figure.video figcaption a")).toHaveAttribute("href", "https://youtu.be/QZfq5xLYdmo");
  // It actually plays in Chromium.
  const playable = await video.evaluate(async (v) => {
    v.muted = true;
    await v.play();
    await new Promise((r) => setTimeout(r, 600));
    return { t: v.currentTime, w: v.videoWidth, h: v.videoHeight };
  });
  expect(playable.t).toBeGreaterThan(0.2);
  expect([playable.w, playable.h]).toEqual([1280, 720]);
});

test("home page links the Microsoft Edge listing too", async ({ page }) => {
  await page.goto(`${server.url}/index.html`);
  await expect(page.locator("a.cta-alt")).toHaveAttribute("href", "https://microsoftedge.microsoft.com/addons/detail/kokbmagcbobpjclpidebikeklmpafhhd");
});

test("home links to Product Hunt with a self-hosted badge", async ({ page }) => {
  await page.goto(`${server.url}/index.html`);
  const badge = page.locator("a.ph-badge");
  await expect(badge).toHaveAttribute("href", "https://www.producthunt.com/products/imgkeep");
  await expect(badge.locator("img")).toHaveAttribute("src", "media/product-hunt-badge.svg");
  expect(await badge.locator("img").evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
});
