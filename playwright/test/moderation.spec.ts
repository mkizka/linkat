import { authorize, expect, test } from "./fixtures";

const admin = { handle: "alice.test", password: "password" };

test.describe("モデレーション", () => {
  test.skip(
    ({ size }) => size === "large",
    "dev-envの管理者アカウントを使うため",
  );

  test("管理者が設定した非表示レベルが閲覧者に反映される", async ({
    page,
    browser,
    login,
    account,
  }) => {
    const boardPath = `/${account.handle}?lng=ja`;
    const adminPage = await (await browser.newContext()).newPage();
    const guestPage = await (await browser.newContext()).newPage();

    await test.step("ボードを保存", async () => {
      await login();
      await page.goto("/edit");
      await page.getByTestId("edit-bar__submit").click();
      await page.waitForURL((url) => url.pathname === `/${account.handle}`);
    });

    await test.step("管理者以外にはメニューに表示の管理が出ない", async () => {
      await page.goto(boardPath);
      await page.getByTestId("board-menu__menu").click();
      await expect(page.getByTestId("board-menu__share")).toBeVisible();
      await expect(page.getByTestId("board-menu__moderation")).toBeHidden();
    });

    await test.step("管理者でログイン", async () => {
      await authorize(adminPage, admin);
    });

    const setLevel = async (label: string) => {
      await adminPage.goto(boardPath);
      await adminPage.getByTestId("board-menu__menu").click();
      await adminPage.getByTestId("board-menu__moderation").click();
      await adminPage.getByLabel(label).check();
      await adminPage.getByRole("button", { name: "保存" }).click();
    };

    await test.step("一覧から除外するとバナーが出るがボードは見られる", async () => {
      await setLevel("一覧から除外");
      await expect(adminPage.getByTestId("moderation-banner")).toHaveText(
        /一覧から除外中/,
      );
      await page.goto(boardPath);
      await expect(page.getByTestId("profile-card__edit")).toBeVisible();
    });

    await test.step("非表示にすると管理者と本人以外には表示できない", async () => {
      await setLevel("非表示");
      await expect(adminPage.getByTestId("moderation-banner")).toHaveText(
        /非表示中/,
      );
      await guestPage.goto(boardPath);
      await expect(guestPage.getByTestId("hidden-board__message")).toHaveText(
        "このボードは表示できません",
      );
      await page.goto(boardPath);
      await expect(page.getByTestId("profile-card__edit")).toBeVisible();
      const response = await guestPage.request.get(`/${account.handle}/og`);
      expect(response.status()).toBe(404);
    });

    await test.step("制限なしに戻すと表示される", async () => {
      await setLevel("制限なし");
      await expect(adminPage.getByTestId("moderation-banner")).toBeHidden();
      await page.goto(boardPath);
      await expect(page.getByTestId("profile-card__edit")).toBeVisible();
    });
  });
});
