import { test } from "@playwright/test";

test.describe("ログイン", () => {
  test("テストアカウントでログインできる", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("login-form__service").fill("http://localhost:2583");
    await page.getByTestId("login-form__identifier").fill("alice.test");
    await page.getByTestId("login-form__password").fill("hunter2");
    await page.getByTestId("login-form__submit").click();
    await page.waitForURL("**/edit");
    await page.waitForTimeout(2000);
  });
});
