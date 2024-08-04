import { configs } from "@mkizka/eslint-config";
import gitignore from "eslint-config-flat-gitignore";

export default [
  gitignore(),
  ...configs.typescript(),
  ...configs.react(),
  ...configs.tailwind(),
  {
    files: ["**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
    },
  },
];
