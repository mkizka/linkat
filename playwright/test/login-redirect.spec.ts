import { expect, submitLoginForm, test } from "./fixtures";

test.describe("ログイン後の戻り先", () => {
  test("ログインが必要なページを開くと、ログイン後にそのページへ戻る", async ({
    page,
    context,
    login,
    account,
  }) => {
    await login();
    await context.clearCookies();
    await page.goto("/settings");
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === "/login" &&
        url.searchParams.get("redirect") === "/settings",
    );
    await submitLoginForm(page, account);
    await expect(page).toHaveURL((url) => url.pathname === "/settings");
  });

  test("許可画面で拒否すると、ログインを始めたページへ戻る", async ({
    page,
    account,
  }) => {
    await page.goto("/login?redirect=/settings");
    await page.getByTestId("login-form__handle").fill(account.handle);
    await page.getByTestId("login-form__submit").click();
    await page.waitForURL((url) => url.pathname === "/oauth/authorize");
    await page.locator("[name='password']").fill(account.password);
    await page.locator("button", { hasText: "Sign in" }).click();
    await page.locator("button", { hasText: "Deny access" }).click();
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === "/login" &&
        url.searchParams.get("redirect") === "/settings",
    );
    await expect(
      page.getByTestId("toaster").locator(".alert-error"),
    ).toBeVisible();
  });

  test("サイト外の戻り先は無視してトップへ戻る", async ({ page, account }) => {
    await page.goto("/login?redirect=//example.com");
    await submitLoginForm(page, account);
    await expect(page).toHaveURL((url) => url.pathname === "/");
  });
});
