import { reactRouter } from "@react-router/dev/vite";
import type { SentryReactRouterBuildOptions } from "@sentry/react-router";
import { sentryReactRouter } from "@sentry/react-router";
import { defineConfig } from "vite";

const sentryConfig: SentryReactRouterBuildOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
};

export default defineConfig((configEnv) => ({
  base: process.env.VITE_CONFIG_BASE ?? "/",
  plugins: [
    reactRouter(),
    !process.env.VITEST && sentryReactRouter(sentryConfig, configEnv),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    target: "es2022",
  },
  test: {
    include: ["app/**/*.spec.ts"],
    coverage: {
      include: ["app/server/**/*.ts"],
      exclude: [
        "app/**/*.spec.ts",
        "app/generated/**/*.ts",
        "app/server/mocks/**/*.ts",
      ],
    },
    globals: true,
    setupFiles: ["./vitest/vitest.setup.ts"],
    globalSetup: ["./vitest/global-setup.ts"],
    fileParallelism: false,
  },
  optimizeDeps: {
    exclude: ["@sentry/react-router"],
  },
}));
