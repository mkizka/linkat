import { expect, test } from "@playwright/test";

test.describe("編集", () => {
  test("カードの編集操作を一通り確認", async ({ page }) => {
    // セットアップ
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
    await page.goto("/edit");

    // カードを追加
    await page.getByTestId("card-form-modal__button").click();
    await page.getByTestId("card-form__text").fill(text1);
    await page.getByTestId("card-form__url").fill("https://example.com");
    await page.getByTestId("card-form__submit").click();
    await expect(card1).toBeVisible();

    // カードを追加(2回目)
    await page.getByTestId("card-form-modal__button").click();
    await page.getByTestId("card-form__text").fill(text2);
    await page.getByTestId("card-form__url").fill("https://example.com");
    await page.getByTestId("card-form__submit").click();
    await expect(card2).toBeVisible();

    // 保存して閲覧ページで順番を確認
    await page.getByTestId("board-viewer__submit").click();
    await page.waitForURL((url) => url.pathname.startsWith("/board/"));
    await expect(card1).toBeVisible();
    await expect(card2).toBeVisible();
    const allCards = await page.getByTestId("sortable-card").allTextContents();
    expect(allCards.indexOf(text1)).toBeLessThan(allCards.indexOf(text2));

    // カードを並べ替える
    await page.getByTestId("profile-card__edit").click();
    await card1
      .locator("[data-movable-handle]")
      .dragTo(card2, { timeout: 2000 });

    // 保存して閲覧ページで順番を確認
    await page.getByTestId("board-viewer__submit").click();
    await page.waitForURL((url) => url.pathname.startsWith("/board/"));
    await expect(card1).toBeVisible();
    await expect(card2).toBeVisible();
    const sorted = await page.getByTestId("sortable-card").allTextContents();
    expect(sorted.indexOf(text1)).toBeGreaterThan(sorted.indexOf(text2));

    // カードを編集
    await page.getByTestId("profile-card__edit").click();
    await card1.getByTestId("sortable-card__edit").click();
    await page.getByTestId("card-form__text").fill(text1Edited);
    await page.getByTestId("card-form__url").fill("https://example.com");
    await page.getByTestId("card-form__submit").click();

    // 保存して閲覧ページで順番を確認
    await page.getByTestId("board-viewer__submit").click();
    await page.waitForURL((url) => url.pathname.startsWith("/board/"));
    await expect(card1).not.toBeVisible();
    await expect(card1Edited).toBeVisible();
    await expect(card2).toBeVisible();

    // カードを編集
    await page.getByTestId("profile-card__edit").click();
    page.on("dialog", (dialog) => dialog.accept());
    await card1Edited.getByTestId("sortable-card__edit").click();
    await page.getByTestId("card-form__delete").click();
    await card2.getByTestId("sortable-card__edit").click();
    await page.getByTestId("card-form__delete").click();

    // 保存して閲覧ページで順番を確認
    await page.getByTestId("board-viewer__submit").click();
    await page.waitForURL((url) => url.pathname.startsWith("/board/"));
    await expect(card1Edited).not.toBeVisible();
    await expect(card2).not.toBeVisible();
  });
});
