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

for (const page of ["index.html", "privacy.html", "support.html", "ideas.html", "404.html"]) {
  test(`${page} opens with no console errors`, async ({ page: tab }) => {
    const errors = [];
    tab.on("pageerror", (e) => errors.push(e.message));
    tab.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    tab.on("requestfailed", (r) => errors.push(`${r.url()} ${r.failure()?.errorText}`));
    await tab.goto(`${server.url}/${page}`, { waitUntil: "networkidle" });
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
  for (const file of ["index.html", "privacy.html", "support.html", "ideas.html", "404.html"]) {
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
    "support.html": "https://imgkeep.app/support.html", "ideas.html": "https://imgkeep.app/ideas.html" };
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
  expect(titles.size).toBe(4);
  expect(descriptions.size).toBe(4);
  expect(await readFile(join(ROOT, "site", "404.html"), "utf8")).toContain('<meta name="robots" content="noindex">');
});
