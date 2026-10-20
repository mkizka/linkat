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

  test("サイト外の戻り先は無視してトップへ戻る", async ({ page, account }) => {
    await page.goto("/login?redirect=//example.com");
    await submitLoginForm(page, account);
    await expect(page).toHaveURL((url) => url.pathname === "/");
  });
});
