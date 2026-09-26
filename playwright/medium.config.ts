import { defineConfig } from "@playwright/test";

import { createBaseConfig } from "./base";
import { PORTS } from "./ports";

const base = createBaseConfig("medium");

export default defineConfig({
  ...base,
  fullyParallel: true,
  use: {
    ...base.use,
    baseURL: "http://localhost:3000",
  },
  webServer: [
    {
      command: "node --env-file .env --import tsx playwright/network.ts",
      cwd: "..",
      wait: { stdout: /atproto network is ready/ },
      stdout: "pipe",
      timeout: 120_000,
    },
    {
      command: "pnpm start:local",
      port: 3000,
      stdout: "pipe",
      reuseExistingServer: !process.env.CI,
      env: {
        ATPROTO_PLC_URL: `http://localhost:${PORTS.plc}`,
        ATPROTO_HANDLE_RESOLVER_URL: `http://localhost:${PORTS.pds}`,
        BSKY_PUBLIC_API_URL: `http://localhost:${PORTS.bsky}`,
      },
    },
  ],
});
