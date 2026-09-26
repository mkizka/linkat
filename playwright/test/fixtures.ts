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
  await authorize(page, handle, password);
};

const loginWithE2EAccount = async (page: Page) => {
  const { E2E_HANDLE, E2E_PASSWORD } = process.env;
  if (!E2E_HANDLE || !E2E_PASSWORD) {
    throw new Error("環境変数E2E_HANDLE, E2E_PASSWORDを設定してください");
  }
  await authorize(page, E2E_HANDLE, E2E_PASSWORD);
};

export const test = base.extend<
  { login: () => Promise<void> },
  { size: TestSize }
>({
  size: ["medium", { option: true, scope: "worker" }],
  login: async ({ page, size }, use) => {
    await use(() =>
      size === "medium" ? loginWithNewAccount(page) : loginWithE2EAccount(page),
    );
  },
});

export { expect } from "@playwright/test";
