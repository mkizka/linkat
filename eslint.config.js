import { configs } from "@mkizka/eslint-config";
import { arrangeActAssert } from "@mkizka/eslint-plugin-aaa";

export default [
  ...configs.typescript(),
  ...configs.react(),
  ...configs.tailwind(),
  {
    rules: {
      "@typescript-eslint/only-throw-error": "off",
    },
  },
  {
    files: ["**/*.spec.ts"],
    ignores: ["e2e/**/*.spec.ts"],
    ...arrangeActAssert,
  },
];
