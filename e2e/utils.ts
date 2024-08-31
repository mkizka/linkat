import { test } from "@playwright/test";

export const restoreStorageState = () => {
  test.use({
    storageState: "./e2e/state.json",
  });
};
