import type { Page } from "@playwright/test";

// モックのOAuthはハンドルからユーザーを作るので、テストごとに別のハンドルを使えば並列実行出来る
export const login = async (page: Page) => {
  const handle = `${crypto.randomUUID()}.test`;
  await page.goto("/login");
  await page.getByTestId("login-form__handle").fill(handle);
  await page.getByTestId("login-form__submit").click();
  await page.waitForURL((url) => url.pathname === "/edit");
  return handle;
};
