import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./node_modules/.cache/playwright",
  fullyParallel: false,
  workers: 2,
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
    {
      name: "alice",
      use: {
        ...devices["Desktop Chrome"],
        locale: "ja-JP",
      },
    },
    {
      name: "bob",
      use: {
        ...devices["iPhone 15 Pro"],
        locale: "ja-JP",
      },
    },
  ],
  webServer: {
    command: "pnpm start:local",
    port: 3000,
    stdout: "pipe",
    reuseExistingServer: !process.env.CI,
  },
});
