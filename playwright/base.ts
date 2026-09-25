import type { PlaywrightTestConfig } from "@playwright/test";

try {
  process.loadEnvFile(".env");
} catch {
  // .envが無い場合は環境変数が既に設定されている前提で無視する
}

// mediumとlargeで成果物の出力先が衝突しないように分ける
export const createBaseConfig = (
  size: "medium" | "large",
): PlaywrightTestConfig => ({
  testDir: `../e2e/${size}`,
  outputDir: `../node_modules/.cache/playwright/${size}`,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ["list", { printSteps: true }],
    ["html", { open: "always", outputFolder: `../playwright-report/${size}` }],
  ],
  use: {
    video: "on",
    trace: "on",
  },
});
