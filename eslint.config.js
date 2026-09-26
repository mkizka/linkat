import { mkizka } from "@mkizka/eslint-config";
import { arrangeActAssert } from "@mkizka/eslint-plugin-aaa";

export default [
  ...mkizka,
  {
    ignores: [".railway/**"],
  },
  {
    rules: {
      "@typescript-eslint/only-throw-error": "off",
    },
  },
  {
    files: ["**/*.spec.ts"],
    ignores: ["playwright/**/*.spec.ts"],
    ...arrangeActAssert,
  },
];
