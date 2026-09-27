import { defineConfig } from "@playwright/test";

import { PORTS } from "../server/constants";
import { defineBaseConfig } from "./base.config";

const base = defineBaseConfig("medium");

export default defineConfig(base, {
  fullyParallel: true,
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: [
    {
      command: "node --import tsx playwright/server/dev-env.ts",
      cwd: "../..",
      wait: { stdout: /atproto network is ready/ },
      stdout: "pipe",
      timeout: 120_000,
    },
    {
      command: "pnpm start:local",
      // WSLのmirroredモードでは空きポートへの接続が応答なしで固まるので、portによる起動済みの確認を避ける
      wait: { stdout: /App listening/ },
      stdout: "pipe",
      env: {
        ATPROTO_PLC_URL: `http://localhost:${PORTS.plc}`,
        ATPROTO_HANDLE_RESOLVER_URL: `http://localhost:${PORTS.pds}`,
        BSKY_PUBLIC_API_URL: `http://localhost:${PORTS.bsky}`,
      },
    },
  ],
});
