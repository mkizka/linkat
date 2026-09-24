import { expect, test } from "@playwright/test";

test.describe("トースト", () => {
  test("ログイン失敗時に表示され、入力内容を保ったまま一定時間で消える", async ({
    page,
  }) => {
    // .invalidは名前解決できないためOAuthのハンドル解決に必ず失敗する
    const handle = "nonexistent-handle-xyz.invalid";

    await page.goto("/login");
    await page.getByTestId("login-form__handle").fill(handle);
    await page.getByTestId("login-form__submit").click();

    const toaster = page.getByTestId("toaster");
    await expect(toaster.locator(".alert-error")).toBeVisible();
    // 画面遷移せずに表示されるので入力内容が残る
    await expect(page.getByTestId("login-form__handle")).toHaveValue(handle);

    // すぐには消えない
    await expect(toaster).toHaveCSS("opacity", "0.9");
    await expect(toaster).toHaveCSS("opacity", "0", { timeout: 10_000 });

    // 消えた後でもう一度失敗させると再び表示される
    await page.getByTestId("login-form__submit").click();
    await expect(toaster).toHaveCSS("opacity", "0.9");
  });
});
