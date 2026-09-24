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

for (const page of ["index.html", "privacy.html", "support.html"]) {
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
  for (const file of ["index.html", "privacy.html", "support.html"]) {
    const html = await readFile(join(ROOT, "site", file), "utf8");
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/gtag\(|googletagmanager|google-analytics|plausible\.io|segment\.com|hotjar|clarity\.ms/i);
  }
});
