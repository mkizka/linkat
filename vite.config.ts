import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  base: process.env.VITE_CONFIG_BASE ?? "/",
  plugins: [reactRouter(), tsconfigPaths()],
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
