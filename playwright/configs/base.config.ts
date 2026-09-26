import { defineConfig } from "@playwright/test";

import type { TestSize } from "../test/fixtures";

try {
  process.loadEnvFile(".env");
} catch {
  // .envが無い場合は環境変数が既に設定されている前提で無視する
}

export const defineBaseConfig = (size: TestSize) =>
  defineConfig<{ size: TestSize }>({
    testDir: "../test",
    testMatch: [`*.common.spec.ts`, `*.${size}.spec.ts`],
    outputDir: `../../node_modules/.cache/playwright/${size}`,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: [
      ["list", { printSteps: true }],
      [
        "html",
        { open: "always", outputFolder: `../../playwright-report/${size}` },
      ],
    ],
    use: {
      size,
      video: "on",
      trace: "on",
    },
  });
