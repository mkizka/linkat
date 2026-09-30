import type { Browser, Page } from "@playwright/test";

import { expect, test } from "./fixtures";

const expectRedirectedToLogin = async (page: Page) => {
  await page.waitForURL((url) => url.pathname === "/login");
  await expect(page.getByTestId("login-form__handle")).toBeVisible();
  await expect(
    page.getByTestId("toaster").locator(".alert-error"),
  ).toBeVisible();
};

test.describe("別のデバイスでログアウトした後", () => {
  test.beforeEach(async ({ page, login }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await login();
  });

  const logoutOnOtherDevice = async (
    browser: Browser,
    login: (page: Page) => Promise<void>,
  ) => {
    const otherPage = await (await browser.newContext()).newPage();
    otherPage.on("dialog", (dialog) => dialog.accept());
    await login(otherPage);
    await otherPage.goto("/settings");
    await otherPage.getByTestId("logout-button").click();
    await otherPage.waitForURL((url) => url.pathname === "/");
  };

  test("保存するとログインし直すよう案内される", async ({
    page,
    browser,
    login,
  }) => {
    await logoutOnOtherDevice(browser, login);
    await page.getByTestId("board-viewer__submit").click();
    await expectRedirectedToLogin(page);
  });

  test("ボードを削除するとログインし直すよう案内される", async ({
    page,
    browser,
    login,
  }) => {
    await page.goto("/settings");
    await logoutOnOtherDevice(browser, login);
    await page.getByTestId("delete-board-button").click();
    await expectRedirectedToLogin(page);
  });

  test("設定ページを開くとログイン画面に移動する", async ({
    page,
    browser,
    login,
  }) => {
    await logoutOnOtherDevice(browser, login);
    await page.goto("/settings");
    await page.waitForURL((url) => url.pathname === "/login");
  });
});
