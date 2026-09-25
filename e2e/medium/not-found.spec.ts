import { expect, test } from "@playwright/test";

test.describe("存在しないパス", () => {
  test("マッチするルートがない場合は404を返す", async ({ page }) => {
    const response = await page.goto("/.well-known/oauth-authorization-server");
    expect(response?.status()).toBe(404);
  });
});
