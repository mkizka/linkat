import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./node_modules/.cache/playwright",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    video: "on",
    trace: "on",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        locale: "ja-JP",
      },
    },
    {
      name: "safari",
      use: {
        ...devices["iPhone 15 Pro"],
        locale: "ja-JP",
      },
    },
  ],
  webServer: {
    command: "pnpm dev",
    port: 3000,
    stdout: "pipe",
    reuseExistingServer: !process.env.CI,
  },
});
