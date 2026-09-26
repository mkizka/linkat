import { type Page, test as base } from "@playwright/test";

import { PORTS } from "../server/constants";

export type TestSize = "medium" | "large";

const authorize = async (page: Page, handle: string, password: string) => {
  await page.goto("/login");
  await page.getByTestId("login-form__handle").fill(handle);
  await page.getByTestId("login-form__submit").click();
  await page.waitForURL((url) => url.pathname === "/oauth/authorize");
  await page.locator("[name='password']").fill(password);
  await page.locator("button", { hasText: "Sign in" }).click();
  await page.locator("button", { hasText: "Authorize" }).click();
  await page.waitForURL((url) => url.pathname === "/edit");
  return { handle, password };
};

const loginWithNewAccount = async (page: Page) => {
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
  return await authorize(page, handle, password);
};

const loginWithLargeTestAccount = async (page: Page) => {
  const { LARGE_TEST_HANDLE, LARGE_TEST_PASSWORD } = process.env;
  if (!LARGE_TEST_HANDLE || !LARGE_TEST_PASSWORD) {
    throw new Error(
      "環境変数LARGE_TEST_HANDLE, LARGE_TEST_PASSWORDを設定してください",
    );
  }
  return await authorize(page, LARGE_TEST_HANDLE, LARGE_TEST_PASSWORD);
};

export const test = base.extend<
  { login: () => Promise<{ handle: string; password: string }> },
  { size: TestSize }
>({
  size: ["medium", { option: true, scope: "worker" }],
  login: async ({ page, size }, use) => {
    await use(() =>
      size === "medium"
        ? loginWithNewAccount(page)
        : loginWithLargeTestAccount(page),
    );
  },
});

export { expect } from "@playwright/test";
