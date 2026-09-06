import { defineConfig } from "@playwright/test";

try {
  process.loadEnvFile(".env");
} catch {
  // .envが無い場合は環境変数が既に設定されている前提で無視する
}

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./node_modules/.cache/playwright",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ["list", { printSteps: true }],
    ["html", { open: "always" }],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://localhost:3000",
    video: "on",
    trace: "on",
  },
  webServer: process.env.PLAYWRIGHT_TEST_BASE_URL
    ? undefined
    : {
        command: "pnpm start:local",
        port: 3000,
        stdout: "pipe",
        reuseExistingServer: !process.env.CI,
      },
});
