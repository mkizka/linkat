/// <reference types="vitest" />
import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    tsconfigPaths(),
  ],
  test: {
    include: ["app/**/*.spec.ts"],
    coverage: {
      include: ["app/**/*.ts"],
      exclude: [
        "app/mocks",
        "app/.server/**/generated",
        "app/.client/**/generated",
      ],
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
