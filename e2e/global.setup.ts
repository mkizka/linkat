import type { Page } from "@playwright/test";
import { test } from "@playwright/test";

const login = async ({
  page,
  identifier,
  password,
}: {
  page: Page;
  identifier: string;
  password: string;
}) => {
  await page.goto("/");
  await page.getByTestId("login-form__service").fill("http://localhost:2583");
  await page.getByTestId("login-form__identifier").fill(identifier);
  await page.getByTestId("login-form__password").fill(password);
  await page.getByTestId("login-form__submit").click();
  await page.waitForURL((url) => url.pathname === "/edit");
  await page
    .context()
    .storageState({ path: `./e2e/states/${identifier}.json` });
};

test.describe("ログイン", () => {
  test("テストアカウントでログインできる(chromium)", async ({ page }) => {
    await login({
      page,
      identifier: "alice.test",
      password: "hunter2",
    });
  });
  test("テストアカウントでログインできる(safari)", async ({ page }) => {
    await login({
      page,
      identifier: "bob.test",
      password: "hunter2",
    });
  });
});
