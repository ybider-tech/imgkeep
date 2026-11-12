// Phase 0.4 fixtures: sites that protect, hide or lazy-load their images.
//   A. The fixture pages and /guarded/ routes behave the way real sites do (plain Chromium, no extension).
//   B. What the real extension does with them TODAY: the baseline the Phase 1 fetch ladder improves on.
import { test, expect } from "@playwright/test";
import { readdir, rm } from "node:fs/promises";
import { launchWithExtension } from "./launch.mjs";
import { startServer, GUARD_COOKIE } from "./servers.mjs";

let cors, plain;

test.beforeAll(async () => {
  [cors, plain] = await Promise.all([startServer({ cors: true }), startServer({ cors: false })]);
});

test.afterAll(async () => {
  await Promise.all([cors?.close(), plain?.close()]);
});

const JPEG_MAGIC = [0xff, 0xd8, 0xff];

test.describe("A. fixtures behave like the real sites", () => {
  test("hotlink protection: 403 without a Referer from the same site, the photo with one", async ({ request }) => {
    const url = `${cors.url}/guarded/hotlink.jpg`;
    expect((await request.get(url)).status()).toBe(403);
    expect((await request.get(url, { headers: { referer: "https://elsewhere.example/page" } })).status()).toBe(403);
    const ok = await request.get(url, { headers: { referer: `${cors.url}/pages/hotlink.html` } });
    expect(ok.status()).toBe(200);
    expect([...(await ok.body()).subarray(0, 3)]).toEqual(JPEG_MAGIC);
  });

  test("hotlink page: the page's own image loads (the browser sends the page as Referer)", async ({ page }) => {
    await page.goto(`${cors.url}/pages/hotlink.html`);
    await expect.poll(() => page.locator("#photo").evaluate((i) => i.naturalWidth)).toBeGreaterThan(0);
    const log = cors.requests.filter((r) => r.path === "/guarded/hotlink.jpg").at(-1);
    expect(log.referer).toBe(`${cors.url}/pages/hotlink.html`);
  });

  test("cookie protection: 403 without the session cookie; the page signs in and its image loads", async ({ page, request }) => {
    const url = `${cors.url}/guarded/cookie.jpg`;
    expect((await request.get(url)).status()).toBe(403);
    expect((await request.get(url, { headers: { cookie: GUARD_COOKIE } })).status()).toBe(200);
    await page.goto(`${cors.url}/pages/cookie.html`);
    await expect.poll(() => page.locator("#photo").evaluate((i) => i.naturalWidth)).toBeGreaterThan(0);
  });

  test("bad answers: an empty 200 and an HTML page labelled image/jpeg", async ({ request }) => {
    const empty = await request.get(`${cors.url}/guarded/empty.jpg`);
    expect(empty.status()).toBe(200);
    expect((await empty.body()).length).toBe(0);
    const wall = await request.get(`${cors.url}/guarded/not-image.jpg`);
    expect(wall.headers()["content-type"]).toBe("image/jpeg");
    expect((await wall.text()).startsWith("<!doctype html>")).toBe(true);
  });

  test("no-CORS server: the page shows the image but the canvas is tainted; the CORS server's is readable", async ({ page, request }) => {
    expect((await request.get(`${plain.url}/photo.png`)).headers()["access-control-allow-origin"]).toBeUndefined();
    expect((await request.get(`${cors.url}/photo.png`)).headers()["access-control-allow-origin"]).toBe("*");
    const readable = (img) =>
      page.evaluate(async (src) => {
        const im = new Image();
        if (src.startsWith("http")) im.crossOrigin = "anonymous";
        im.src = src;
        await im.decode().catch(() => {});
        // A page that asks for permission to read (crossOrigin) gets a broken image from a server without CORS.
        try {
          const c = document.createElement("canvas");
          c.width = c.height = 4;
          c.getContext("2d").drawImage(im, 0, 0);
          c.getContext("2d").getImageData(0, 0, 1, 1);
          return true;
        } catch {
          return false;
        }
      }, img);
    await page.goto(`${cors.url}/pages/cross-origin.html?img=${encodeURIComponent(`${plain.url}/photo.png`)}`);
    await expect.poll(() => page.locator("#photo").evaluate((i) => i.naturalWidth)).toBeGreaterThan(0);
    // Drawn without crossOrigin, a cross-origin image taints the canvas, which is why the page canvas can't be used.
    const tainted = await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = c.height = 4;
      c.getContext("2d").drawImage(document.getElementById("photo"), 0, 0);
      try {
        c.getContext("2d").getImageData(0, 0, 1, 1);
        return false;
      } catch {
        return true;
      }
    });
    expect(tainted).toBe(true);
    expect(await readable(`${cors.url}/photo.png`)).toBe(true);
    expect(await readable(`${plain.url}/photo.png`)).toBe(false);
  });

  test("picture and srcset: the browser picks one candidate, a larger original is also listed", async ({ page }) => {
    await page.goto(`${cors.url}/pages/picture.html`);
    const info = await page.evaluate(() => {
      const img = document.getElementById("photo");
      return {
        current: img.currentSrc.split("/").pop(),
        sources: document.querySelectorAll("#pic source").length,
        candidates: [...document.querySelectorAll("#pic source, #pic img")].flatMap((n) => (n.srcset || "").split(",").map((s) => s.trim().split(/\s+/)[0].split("/").pop())),
      };
    });
    expect(info.sources).toBe(2);
    expect(info.current).toBe("photo.avif"); // first source the browser supports, at 320 px
    expect(info.candidates).toContain("wide.webp"); // the largest listed original
  });

  test("lazy images: nothing loaded until scrolled into view; the real address sits in data-src", async ({ page }) => {
    await page.goto(`${cors.url}/pages/lazy.html`);
    expect(await page.locator("#scripted").getAttribute("src")).toBeNull();
    expect(await page.locator("#scripted").getAttribute("data-src")).toBe("../wide.webp");
    expect(await page.locator("#native").evaluate((i) => i.complete && i.naturalWidth > 0)).toBe(false);
    await page.locator("#scripted").scrollIntoViewIfNeeded();
    await expect.poll(() => page.locator("#scripted").getAttribute("src")).toBe("../wide.webp");
    await expect.poll(() => page.locator("#native").evaluate((i) => i.naturalWidth)).toBeGreaterThan(0);
  });

  test("CSS backgrounds: the image is only a computed style, alone or under a gradient", async ({ page }) => {
    await page.goto(`${cors.url}/pages/css-background.html`);
    const bg = (sel) => page.locator(sel).evaluate((e) => getComputedStyle(e).backgroundImage);
    expect(await bg("#hero")).toContain("/photo.jpg");
    const multi = await bg("#multi");
    expect(multi).toContain("linear-gradient");
    expect(multi).toContain("/wide.webp");
    expect(await page.locator("#hero img").count()).toBe(0);
  });

  test("right-click blocked: the page cancels the menu and an empty layer covers an untouchable image", async ({ page }) => {
    await page.goto(`${cors.url}/pages/blocked.html`);
    const box = await page.locator("#wrap").boundingBox();
    const at = { x: box.x + 80, y: box.y + 60 };
    await page.mouse.click(at.x, at.y, { button: "right" });
    expect(await page.evaluate(() => window.__blocked)).toBe(1);
    expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y).id, at)).toBe("shield");
    expect(await page.locator("#photo").evaluate((i) => getComputedStyle(i).pointerEvents)).toBe("none");
  });
});

// B. The real extension, today. These pin current behaviour: when Phase 1 improves a case, the matching
// assertion changes on purpose (and the test.fixme entries below become real tests).
test.describe("B. the extension on protected sites, as of 0.12", () => {
  test.describe.configure({ mode: "serial" });
  let ctx;

  test.beforeAll(async () => {
    ctx = await launchWithExtension();
  });

  test.afterAll(async () => {
    await ctx?.context.close();
    if (ctx) await rm(ctx.userDataDir, { recursive: true, force: true });
  });

  const run = (url, format = "png") => ctx.sw.evaluate(({ url, format }) => globalThis.imgkeepRunJob({ url, format }), { url, format });
  const savedFiles = async () => (await readdir(ctx.downloadsDir, { recursive: true })).length;

  test("a hotlink-protected image fails with its status and saves no file", async () => {
    const before = await savedFiles();
    const result = await run(`${cors.url}/guarded/hotlink.jpg`);
    expect(result).toMatchObject({ ok: false, reason: "error", code: "http", detail: "403" });
    expect(await savedFiles()).toBe(before);
    // The fetch had no Referer: that is the gap fetch-ladder step 2 closes.
    const sent = cors.requests.filter((r) => r.path === "/guarded/hotlink.jpg").at(-1);
    expect(sent.referer).toBeNull();
  });

  test("an empty answer is never saved as a file", async () => {
    const before = await savedFiles();
    const result = await run(`${cors.url}/guarded/empty.jpg`);
    expect(result).toMatchObject({ ok: false, reason: "error", code: "decode" });
    expect(await savedFiles()).toBe(before);
  });

  test("an HTML login page labelled as an image is never saved as a file", async () => {
    const before = await savedFiles();
    const result = await run(`${cors.url}/guarded/not-image.jpg`);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("error");
    expect(await savedFiles()).toBe(before);
  });

  test("a no-CORS image asks for that one site instead of failing silently", async () => {
    const result = await run(`${plain.url}/photo.png`);
    expect(result).toMatchObject({ ok: false, reason: "host" });
  });

  // Targets for Phase 1 (fetch ladder, 1.1). Turn each into a real test when its step lands.
  test.fixme("a hotlink-protected image saves once the Referer fallback is allowed (1.1 step 2)", async () => {});
  test.fixme("a screenshot of the visible image is saved, and flagged as screenshot quality, when every fetch fails (1.1 step 4)", async () => {});
});
