import { defineConfig } from "@playwright/test";

import { createBaseConfig } from "./base";

const base = createBaseConfig("medium");

// 外部システムをモックに置き換えたローカルのサーバーに対して実行する
export default defineConfig({
  ...base,
  // テストごとに別のユーザーを使うので並列実行しても影響しあわない
  fullyParallel: true,
  use: {
    ...base.use,
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: "pnpm start:local",
    port: 3000,
    stdout: "pipe",
    reuseExistingServer: !process.env.CI,
    env: {
      E2E_MOCK: "true",
    },
  },
});
