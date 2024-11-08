import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  base: process.env.VITE_CONFIG_BASE ?? "/",
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
      },
    }),
    tsconfigPaths(),
  ],
  test: {
    include: ["app/**/*.spec.ts"],
    coverage: {
      include: ["app/server/**/*.ts"],
      exclude: ["app/**/*.spec.ts", "app/generated/**/*.ts"],
    },
    // vitest-environment-vprisma
    globals: true,
    environment: "vprisma",
    setupFiles: [
      "vitest-environment-vprisma/setup",
      "./vitest/vitest.setup.ts",
    ],
    globalSetup: ["./vitest/global-setup.ts"],
  },
});
