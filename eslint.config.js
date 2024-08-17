import { configs } from "@mkizka/eslint-config";
import { arrangeActAssert } from "@mkizka/eslint-plugin-aaa";

export default [
  ...configs.typescript(),
  ...configs.react(),
  ...configs.tailwind(),
  {
    files: ["**/*.spec.ts"],
    ignores: ["e2e/**/*.spec.ts"],
    ...arrangeActAssert,
  },
];
