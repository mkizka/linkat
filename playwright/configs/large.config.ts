import { defineConfig } from "@playwright/test";

import { defineBaseConfig } from "./base.config";

const base = defineBaseConfig("large");

export default defineConfig(base, {
  // 同じアカウントのボードを更新するので並列実行しない
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL ?? "https://linkat.blue",
  },
});
