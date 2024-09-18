import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./node_modules/.cache/playwright",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ["list", { printSteps: true }],
    ["html", { open: "always" }],
  ],
  use: {
    baseURL: "http://linkat.localhost:3000",
    video: "on",
    trace: "on",
  },
  projects: [
    // https://playwright.dev/docs/auth
    {
      name: "setup",
      testMatch: "global.setup.ts",
    },
    {
      name: "safari",
      use: {
        ...devices["iPhone 15 Pro"],
        locale: "ja-JP",
        storageState: "./e2e/states/bob.test.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        locale: "ja-JP",
        storageState: "./e2e/states/alice.test.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "pnpm start:e2e",
    port: 3000,
    stdout: "pipe",
    reuseExistingServer: !process.env.CI,
  },
});
