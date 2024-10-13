import { expect, test } from "@playwright/test";

test.describe("ログアウト", () => {
  test("ログアウトボタンを押すとダイアログが出てログアウトできる", async ({
    page,
  }) => {
    await page.goto("/");
    page.on("dialog", (dialog) => dialog.accept());
    const logoutButton = page.getByTestId("logout-button");
    await logoutButton.click();
    await expect(logoutButton).not.toBeVisible();
  });
  test("ログアウトボタンを押したあとキャンセルできる", async ({ page }) => {
    await page.goto("/");
    page.on("dialog", (dialog) => dialog.dismiss());
    const logoutButton = page.getByTestId("logout-button");
    await logoutButton.click();
    await page.waitForTimeout(1000); // 何も起きないことを確認するために待つ
    await expect(logoutButton).toBeVisible();
  });
});
