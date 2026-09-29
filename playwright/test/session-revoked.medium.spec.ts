import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

const expectInvalidSession = async (page: Page, pathname: string) => {
  await page.waitForURL((url) => url.pathname === pathname);
  await expect(
    page.getByTestId("toaster").locator(".alert-error"),
  ).toBeVisible();
  await page.goto("/login");
  await expect(page.getByTestId("login-form__handle")).toBeVisible();
};

test.describe("別のデバイスでログアウトした後", () => {
  test.beforeEach(async ({ page, browser, login }) => {
    const otherPage = await (await browser.newContext()).newPage();
    page.on("dialog", (dialog) => dialog.accept());
    otherPage.on("dialog", (dialog) => dialog.accept());

    await login();
    await login(otherPage);
    await otherPage.goto("/settings");
    await otherPage.getByTestId("logout-button").click();
    await otherPage.waitForURL((url) => url.pathname === "/");
  });

  test("保存するとログインし直すよう案内される", async ({ page }) => {
    await page.getByTestId("board-viewer__submit").click();
    await expectInvalidSession(page, "/login");
  });

  test("ボードを削除するとログインし直すよう案内される", async ({ page }) => {
    await page.goto("/settings");
    await page.getByTestId("delete-board-button").click();
    await expectInvalidSession(page, "/");
  });
});
