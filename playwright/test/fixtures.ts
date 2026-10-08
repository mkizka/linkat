import { type Page, test as base } from "@playwright/test";
import { z } from "zod";

import { PORTS } from "../server/constants";

export type TestSize = "medium" | "large";

type Account = { handle: string; password: string };

const authorize = async (page: Page, { handle, password }: Account) => {
  await page.goto("/login");
  await page.getByTestId("login-form__handle").fill(handle);
  await page.getByTestId("login-form__submit").click();
  await page.waitForURL((url) => url.pathname === "/oauth/authorize");
  await page.locator("[name='password']").fill(password);
  await page.locator("button", { hasText: "Sign in" }).click();
  await page.locator("button", { hasText: "Authorize" }).click();
  await page.waitForURL((url) => url.pathname === "/edit");
};

const createAccount = async (): Promise<Account> => {
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
  return { handle, password };
};

export const xrpc = async (nsid: string, body: object, accessJwt?: string) => {
  const response = await fetch(`http://localhost:${PORTS.pds}/xrpc/${nsid}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessJwt && { Authorization: `Bearer ${accessJwt}` }),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`${nsid}に失敗しました: ${await response.text()}`);
  }
  return response;
};

export const createSession = async ({ handle, password }: Account) => {
  const response = await xrpc("com.atproto.server.createSession", {
    identifier: handle,
    password,
  });
  return z
    .object({ did: z.string(), accessJwt: z.string() })
    .parse(await response.json());
};

const getLargeTestAccount = (): Account => {
  const { LARGE_TEST_HANDLE, LARGE_TEST_PASSWORD } = process.env;
  if (!LARGE_TEST_HANDLE || !LARGE_TEST_PASSWORD) {
    throw new Error(
      "環境変数LARGE_TEST_HANDLE, LARGE_TEST_PASSWORDを設定してください",
    );
  }
  return { handle: LARGE_TEST_HANDLE, password: LARGE_TEST_PASSWORD };
};

export const test = base.extend<
  { account: Account; login: (target?: Page) => Promise<void> },
  { size: TestSize }
>({
  size: ["medium", { option: true, scope: "worker" }],
  account: async ({ size }, use) => {
    await use(
      size === "medium" ? await createAccount() : getLargeTestAccount(),
    );
  },
  login: async ({ page, account }, use) => {
    await use((target = page) => authorize(target, account));
  },
});

export { expect } from "@playwright/test";
