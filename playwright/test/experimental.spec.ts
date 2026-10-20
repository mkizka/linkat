import { expect, test } from "./fixtures";

test.describe("試験機能", () => {
  test("ログイン中に開くと有効と無効が切り替わる", async ({ page, login }) => {
    await login();
    const toaster = page.getByTestId("toaster");

    await page.goto("/experimental");
    await expect(toaster).toHaveText("Experimental features enabled");

    await page.goto("/experimental");
    await expect(toaster).toHaveText("Experimental features disabled");
  });

  test("ログインしていなければログイン画面に移動する", async ({ page }) => {
    await page.goto("/experimental");
    await expect(page).toHaveURL((url) => url.pathname === "/login");
  });
});
