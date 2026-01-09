import { typescript, react } from "@mkizka/eslint-config";
import { arrangeActAssert } from "@mkizka/eslint-plugin-aaa";

export default [
  ...typescript(),
  ...react(),
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
