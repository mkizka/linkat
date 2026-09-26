import type { Page } from "@playwright/test";

import { PORTS } from "../../playwright/ports";

// テストごとにlocalhostのPDSへ別のアカウントを作るので並列実行出来る
export const login = async (page: Page) => {
  const handle = `u${crypto.randomUUID().slice(0, 8)}.test`;
  const password = crypto.randomUUID();
  const response = await fetch(
    `http://localhost:${PORTS.pds}/xrpc/com.atproto.server.createAccount`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle,
        password,
        email: `${handle}@example.com`,
      }),
    },
  );
  if (!response.ok) {
    throw new Error(`アカウントの作成に失敗しました: ${await response.text()}`);
  }
  await page.goto("/login");
  await page.getByTestId("login-form__handle").fill(handle);
  await page.getByTestId("login-form__submit").click();
  await page.waitForURL((url) => url.pathname === "/oauth/authorize");
  await page.locator("[name='password']").fill(password);
  await page.locator("button", { hasText: "Sign in" }).click();
  await page.locator("button", { hasText: "Authorize" }).click();
  await page.waitForURL((url) => url.pathname === "/edit");
  return handle;
};
