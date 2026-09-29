// Renders store/video/demo.html into store/imgkeep-demo.webm (1280×720, 30 fps, VP8).
// Each frame is drawn by the page's render(t) and screenshotted, so the video is smooth and identical on
// every run. Frames are encoded with the ffmpeg that Playwright installs for its own screen recording.
//
//   node store/video/render.mjs            full video + poster image
//   node store/video/render.mjs --stills   a few stills in store/video/_stills/ to check the layout
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { readdirSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const STORE = join(HERE, "..");
const FPS = 30;

function playwrightFfmpeg() {
  const cache = join(homedir(), "Library", "Caches", "ms-playwright");
  const dir = existsSync(cache) && readdirSync(cache).find((d) => d.startsWith("ffmpeg-"));
  const bin = dir && join(cache, dir, process.platform === "darwin" ? "ffmpeg-mac" : "ffmpeg-linux");
  if (!bin || !existsSync(bin)) throw new Error("Playwright's ffmpeg not found. Run: npx playwright install ffmpeg");
  return bin;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(pathToFileURL(join(HERE, "demo.html")).href);
const duration = await page.evaluate(() => window.ready);

if (process.argv.includes("--stills")) {
  const out = join(HERE, "_stills");
  mkdirSync(out, { recursive: true });
  for (const t of [1.5, 5.3, 7.0, 8.3, 10.5, 16.0, 17.1, 18.5, 22.5, 26.5]) {
    await page.evaluate((t) => window.render(t), t);
    await page.screenshot({ path: join(out, `t${String(t).replace(".", "_")}.png`) });
  }
  console.log(`stills in ${out}`);
} else {
  const target = join(STORE, "imgkeep-demo.webm");
  const ffmpeg = spawn(playwrightFfmpeg(), [
    "-y", "-loglevel", "error",
    "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "/dev/stdin",
    "-c:v", "libvpx", "-b:v", "6M", "-crf", "8", "-deadline", "good", "-cpu-used", "1",
    "-pix_fmt", "yuv420p", "-auto-alt-ref", "0", target,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((resolve, reject) => ffmpeg.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)))));
  const frames = Math.round(duration * FPS);
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.render(t), i / FPS);
    const jpg = await page.screenshot({ type: "jpeg", quality: 95 });
    if (!ffmpeg.stdin.write(jpg)) await new Promise((r) => ffmpeg.stdin.once("drain", r));
  }
  ffmpeg.stdin.end();
  await done;
  // Poster: the moment "GIF (keeps animation)" is chosen.
  await page.evaluate((t) => window.render(t), 8.3);
  await page.screenshot({ path: join(STORE, "imgkeep-demo-poster.png") });
  console.log(`${frames} frames → store/imgkeep-demo.webm, poster → store/imgkeep-demo-poster.png`);
}
await browser.close();
