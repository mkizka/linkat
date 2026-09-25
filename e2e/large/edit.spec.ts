import { expect, test } from "@playwright/test";

const E2E_HANDLE = process.env.E2E_HANDLE;
const E2E_PASSWORD = process.env.E2E_PASSWORD;
if (!E2E_HANDLE || !E2E_PASSWORD) {
  throw new Error("環境変数E2E_HANDLE, E2E_PASSWORDを設定してください");
}

// 細かい編集操作はmediumテストで確認するので、ここでは実際のPDSと繋がることだけを確認する
test.describe("編集", () => {
  test("実際のアカウントでログインしてボードを保存出来る", async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());

    await test.step("ログイン", async () => {
      await page.goto("/login");
      await page.getByTestId("login-form__handle").fill(E2E_HANDLE);
      await page.getByTestId("login-form__submit").click();
      await page.waitForURL((url) => url.pathname === "/oauth/authorize");
      await page.locator("[name='password']").fill(E2E_PASSWORD);
      await page.locator("button", { hasText: "Sign in" }).click();
      await page.locator("button", { hasText: "Authorize" }).click();
      await page.waitForURL((url) => url.pathname === "/edit");
    });

    const text = `1. ${crypto.randomUUID()}`;
    const card = page.locator('[data-testid="sortable-card"]', {
      hasText: text,
    });

    await test.step("カードを追加", async () => {
      await page.getByTestId("card-form-modal__button").click();
      await page.getByTestId("card-form__url").fill("https://example.com");
      await page.getByTestId("card-form__text").fill(text);
      await page.getByTestId("card-form__submit").click();
      await expect(card).toBeVisible();
    });

    await test.step("保存して閲覧ページで確認", async () => {
      await page.getByTestId("board-viewer__submit").click();
      await page.waitForURL((url) => url.pathname !== "/edit");
      await page.getByTestId("show-modal__close").click();
      await expect(card).toBeVisible();
    });

    await test.step("ボードを削除", async () => {
      await page.goto("/settings");
      await page.getByTestId("delete-board-button").click();
      await page.getByTestId("index__edit-link").click();
      await page.waitForURL("/edit");
      await expect(card).not.toBeVisible();
    });

    await test.step("ログアウト", async () => {
      await page.goto("/settings");
      await page.getByTestId("logout-button").click();
      await page.waitForURL((url) => url.pathname === "/");
      await expect(page.getByTestId("index__login-link")).toBeVisible();
    });
  });
});
