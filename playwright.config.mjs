import { defineConfig } from "@playwright/test";

// One worker: every extension test shares a single Chromium profile.
export default defineConfig({
  testDir: "tests",
  testMatch: /.*\.spec\.mjs/,
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  reporter: [["list"]],
});
