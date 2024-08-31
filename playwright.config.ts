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
    baseURL: "http://localhost:3000",
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
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        locale: "ja-JP",
      },
      dependencies: ["setup"],
    },
    {
      name: "safari",
      use: {
        ...devices["iPhone 15 Pro"],
        locale: "ja-JP",
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
