import { test } from "@playwright/test";

test.describe("編集", () => {
  test("非ログイン時はトップにリダイレクト", async ({ page }) => {
    await page.goto("/edit");
    await page.waitForURL((url) => url.pathname === "/");
    await page.waitForTimeout(2000);
  });
});
