import type { Project } from "@playwright/test";
import { defineConfig, devices } from "@playwright/test";

const browsers = [
  {
    name: "chromium",
    use: {
      ...devices["Desktop Chrome"],
      locale: "ja-JP",
    },
    dependencies: ["setup"],
  },
  {
    name: "safari",
    use: {
      ...devices["iPhone 15 Pro"],
      locale: "ja-JP",
    },
    dependencies: ["setup"],
  },
] satisfies Project[];

const projects = browsers.flatMap(
  ({ name, ...browser }) =>
    [
      {
        ...browser,
        name: `${name}_serial`,
        testDir: "./e2e/serial",
        use: {
          ...browser.use,
          storageState: "./e2e/state.json",
        },
        dependencies:
          // Safari → Chromium の順に実行させる
          name === "chromium" ? ["safari_serial"] : browser.dependencies,
      },
      {
        ...browser,
        name: `${name}_parallel`,
        testDir: "./e2e/parallel",
        fullyParallel: true,
      },
    ] satisfies Project[],
);

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./node_modules/.cache/playwright",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ["list", { printSteps: true }],
    ["html", { open: "always" }],
  ],
  use: {
    baseURL: "http://localhost:3000",
    video: "on",
    trace: "on",
  },
  projects: [
    // https://playwright.dev/docs/auth
    {
      name: "setup",
      testMatch: "global.setup.ts",
    },
    ...projects,
  ],
  webServer: {
    command: "pnpm start:e2e",
    port: 3000,
    stdout: "pipe",
    reuseExistingServer: !process.env.CI,
  },
});
