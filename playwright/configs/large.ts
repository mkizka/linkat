import { defineConfig } from "@playwright/test";

import { defineBaseConfig } from "./base";

const base = defineBaseConfig("large");

export default defineConfig(base, {
  // 同じアカウントのボードを更新するので並列実行しない
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://localhost:3000",
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
