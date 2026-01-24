import { expect, test } from "@playwright/test";

test.describe("編集", () => {
  test("カードの編集操作を一通り確認", async ({ page }, testInfo) => {
    await test.step("ログイン", async () => {
      const identifier =
        testInfo.project.name === "alice" ? "alice.test" : "bob.test";
      await page.goto("/login");
      await page.getByTestId("login-form__identifier").fill(identifier);
      await page.getByTestId("login-form__submit").click();
      await page.waitForURL((url) => url.pathname === "/oauth/authorize");
      await page.locator("[name='password']").fill("hunter2");
      await page.locator("button", { hasText: "Sign in" }).click();
      await page.locator("button", { hasText: "Authorize" }).click();
      await page.waitForURL((url) => url.pathname === "/edit");
    });

    const text1 = `1. ${crypto.randomUUID()}`;
    const text2 = `2. ${crypto.randomUUID()}`;
    const text1Edited = `1(edit). ${crypto.randomUUID()}`;
    const card1 = page.locator('[data-testid="sortable-card"]', {
      hasText: text1,
    });
    const card2 = page.locator('[data-testid="sortable-card"]', {
      hasText: text2,
    });
    const card1Edited = page.locator('[data-testid="sortable-card"]', {
      hasText: text1Edited,
    });

    await test.step("カードを追加", async () => {
      await page.getByTestId("card-form-modal__button").click();
      await page.getByTestId("card-form__url").fill("https://example.com");
      await page.getByTestId("card-form__text").fill(text1);
      await page.getByTestId("card-form__submit").click();
      await expect(card1).toBeVisible();
    });

    await test.step("カードを追加(2回目)", async () => {
      await page.getByTestId("card-form-modal__button").click();
      await page.getByTestId("card-form__url").fill("https://example.com");
      await page.getByTestId("card-form__text").fill(text2);
      await page.getByTestId("card-form__submit").click();
      await expect(card2).toBeVisible();
    });

    await test.step("保存して閲覧ページで順番を確認", async () => {
      await page.getByTestId("board-viewer__submit").click();
      await page.waitForURL((url) => url.pathname !== "/edit");
      await page.getByTestId("show-modal__close").click();
      await expect(card1).toBeVisible();
      await expect(card2).toBeVisible();
      const allCards = await page
        .getByTestId("sortable-card")
        .allTextContents();
      expect(allCards.indexOf(text1)).toBeLessThan(allCards.indexOf(text2));
    });

    await test.step("カードを並べ替える", async () => {
      await page.getByTestId("profile-card__edit").click();
      await card1
        .locator("[data-movable-handle]")
        .dragTo(card2, { timeout: 2000 });
    });

    await test.step("保存して閲覧ページで順番を確認", async () => {
      await page.getByTestId("board-viewer__submit").click();
      await page.waitForURL((url) => url.pathname !== "/edit");
      await page.getByTestId("show-modal__close").click();
      await expect(card1).toBeVisible();
      await expect(card2).toBeVisible();
      const sorted = await page.getByTestId("sortable-card").allTextContents();
      expect(sorted.indexOf(text1)).toBeGreaterThan(sorted.indexOf(text2));
    });

    await test.step("カードを編集", async () => {
      await page.getByTestId("profile-card__edit").click();
      await card1.getByTestId("sortable-card__edit").click();
      await page.getByTestId("card-form__url").fill("https://example.com");
      await page.getByTestId("card-form__text").fill(text1Edited);
      await page.getByTestId("card-form__submit").click();
    });

    await test.step("保存して閲覧ページで編集を確認", async () => {
      await page.getByTestId("board-viewer__submit").click();
      await page.waitForURL((url) => url.pathname !== "/edit");
      await page.getByTestId("show-modal__close").click();
      await expect(card1).not.toBeVisible();
      await expect(card1Edited).toBeVisible();
      await expect(card2).toBeVisible();
    });

    await test.step("カードを削除", async () => {
      await page.getByTestId("profile-card__edit").click();
      page.on("dialog", (dialog) => dialog.accept());
      await card1Edited.getByTestId("sortable-card__edit").click();
      await page.getByTestId("card-form__delete").click();
    });

    await test.step("保存して閲覧ページで削除を確認", async () => {
      await page.getByTestId("board-viewer__submit").click();
      await page.waitForURL((url) => url.pathname !== "/edit");
      await page.getByTestId("show-modal__close").click();
      await expect(card1Edited).not.toBeVisible();
    });

    await test.step("ボードを削除", async () => {
      await page.goto("/settings");
      await page.getByTestId("delete-board-button").click();
    });

    await test.step("編集ページで削除されていることを確認", async () => {
      await page.getByTestId("index__edit-link").click();
      await page.waitForURL("/edit");
      await expect(
        page.locator('[data-testid="sortable-card"]'),
      ).not.toBeVisible();
    });

    await test.step("ログアウト", async () => {
      await page.goto("/settings");
      page.on("dialog", (dialog) => dialog.accept());
      await page.getByTestId("logout-button").click();
      await page.waitForURL((url) => url.pathname === "/");
      await expect(page.getByTestId("index__login-link")).toBeVisible();
    });
  });
});
