import { configs } from "@mkizka/eslint-config";

export default [
  ...configs.typescript(),
  ...configs.react(),
  ...configs.tailwind(),
];
