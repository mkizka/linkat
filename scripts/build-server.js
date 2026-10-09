import { sentryEsbuildPlugin } from "@sentry/bundler-plugins/esbuild";
import { build } from "esbuild";
import fs from "fs";

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf-8"));

build({
  entryPoints: ["./app/server.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outdir: "./dist",
  sourcemap: true,
  logOverride: { "import-is-undefined": "silent" },
  external: [
    "lightningcss", // なぜか必要
    "../build/server/index.js",
    ...Object.keys(pkg.dependencies),
    ...Object.keys(pkg.devDependencies),
  ],
  plugins: process.env.SENTRY_AUTH_TOKEN
    ? [
        sentryEsbuildPlugin({
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          authToken: process.env.SENTRY_AUTH_TOKEN,
          release: { name: process.env.RAILWAY_GIT_COMMIT_SHA },
        }),
      ]
    : [],
});
