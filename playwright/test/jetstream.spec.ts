import { createSession, expect, test, xrpc } from "./fixtures";

test.describe("Jetstream", () => {
  test.skip(({ size }) => size === "large", "dev-envのPDSを操作するため");

  test("アカウントを無効化するとボードが本人以外には非表示になる", async ({
    page,
    browser,
    login,
    account,
  }) => {
    const guestPage = await (await browser.newContext()).newPage();

    await test.step("ボードを保存", async () => {
      await login();
      await page.getByTestId("board-viewer__submit").click();
      await page.waitForURL((url) => url.pathname === `/${account.handle}`);
    });

    await test.step("PDSでアカウントを無効化", async () => {
      const { accessJwt } = await createSession(account);
      await xrpc("com.atproto.server.deactivateAccount", {}, accessJwt);
    });

    await test.step("本人以外にはボードの代わりにstatusを表示する", async () => {
      await expect(async () => {
        await guestPage.goto(`/${account.handle}?lng=ja`);
        await expect(guestPage.getByTestId("hidden-board__message")).toHaveText(
          "このボードは表示できません: deactivated",
          { timeout: 1000 },
        );
      }).toPass();
    });

    await test.step("本人にはボードを表示する", async () => {
      await page.goto(`/${account.handle}?lng=ja`);
      await expect(page.getByTestId("profile-card__edit")).toBeVisible();
    });

    await test.step("OG画像は404にする", async () => {
      const response = await page.request.get(`/${account.handle}/og`);
      expect(response.status()).toBe(404);
    });
  });
});
