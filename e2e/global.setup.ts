import { test } from "@playwright/test";

test.describe("ログイン", () => {
  ["alice.test", "bob.test"].forEach((identifier) => {
    test(`テストアカウントでログインできる(${identifier})`, async ({
      page,
    }) => {
      await page.goto("/login");
      await page.getByTestId("login-form__identifier").fill(identifier);
      await page.getByTestId("login-form__submit").click();

      // OAuthログイン
      await page.waitForURL((url) => url.pathname === "/oauth/authorize");
      await page.locator("[name='password']").fill("hunter2");
      await page.locator("button", { hasText: "Sign in" }).click();
      await page.locator("button", { hasText: "Authorize" }).click();

      // ログイン完了
      await page.waitForURL((url) => url.pathname === "/edit");
      await page
        .context()
        .storageState({ path: `./e2e/states/${identifier}.json` });
    });
  });
});
