import { test } from "@playwright/test";

export const resetStorageState = () => {
  test.use({
    storageState: { cookies: [], origins: [] },
  });
};
