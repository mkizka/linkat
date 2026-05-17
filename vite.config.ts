import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  base: process.env.VITE_CONFIG_BASE ?? "/",
  plugins: [reactRouter(), tsconfigPaths()],
  build: {
    target: "es2022",
  },
  // @ts-expect-error vitest@3 types don't extend vite@8's UserConfig yet
  test: {
    include: ["app/**/*.spec.ts"],
    coverage: {
      include: ["app/server/**/*.ts"],
      exclude: ["app/**/*.spec.ts", "app/generated/**/*.ts"],
    },
    globals: true,
    setupFiles: ["./vitest/vitest.setup.ts"],
    globalSetup: ["./vitest/global-setup.ts"],
    fileParallelism: false,
  },
});
