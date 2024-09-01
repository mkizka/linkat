import { test } from "@playwright/test";

test.describe("ログイン", () => {
  ["alice.test", "bob.test"].forEach((identifier) => {
    test(`テストアカウントでログインできる(${identifier})`, async ({
      page,
    }) => {
      await page.goto("/");
      await page
        .getByTestId("login-form__service")
        .fill("http://localhost:2583");
      await page.getByTestId("login-form__identifier").fill(identifier);
      await page.getByTestId("login-form__password").fill("hunter2");
      await page.getByTestId("login-form__submit").click();
      await page.waitForURL((url) => url.pathname === "/edit");
      await page
        .context()
        .storageState({ path: `./e2e/states/${identifier}.json` });
    });
  });
});
