import { build } from "esbuild";
import fs from "fs";

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf-8"));

const external = [
  "lightningcss", // なぜか必要
  "../build/server/index.js",
  ...Object.keys(pkg.dependencies),
  ...Object.keys(pkg.devDependencies),
];

build({
  entryPoints: ["./app/server.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outdir: "./dist",
  external,
});

build({
  entryPoints: ["./app/server/migrate.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "./dist/migrate.js",
  external,
});
