import { expect, test } from "@playwright/test";

test.describe("編集", () => {
  test("カードを追加して保存すると閲覧ページに反映される", async ({ page }) => {
    const card1 = `1. ${crypto.randomUUID()}`;
    const card2 = `2. ${crypto.randomUUID()}`;
    await page.goto("/edit?base=alice.test");

    // カードを追加
    await page.getByTestId("add-card-modal__button").click();
    await page.getByTestId("add-card-form__text").fill(card1);
    await page.getByTestId("add-card-form__url").fill("https://example.com");
    await page.getByTestId("add-card-form__submit").click();
    await expect(page.locator(`text=${card1}`)).toBeVisible();

    // カードを追加(2回目)
    await page.getByTestId("add-card-modal__button").click();
    await page.getByTestId("add-card-form__text").fill(card2);
    await page.getByTestId("add-card-form__url").fill("https://example.com");
    await page.getByTestId("add-card-form__submit").click();
    await expect(page.locator(`text=${card2}`)).toBeVisible();

    // 保存ボタン押下、Firehose反映待ち
    await page.getByTestId("board-viewer__submit").click();
    await page.waitForTimeout(1000);

    // 閲覧ページで順番を確認
    await page.goto("/board/alice.test");
    await expect(page.locator(`text=${card1}`)).toBeVisible();
    await expect(page.locator(`text=${card2}`)).toBeVisible();
    const allCards = await page.getByTestId("sortable-card").allTextContents();
    expect(allCards.indexOf(card1)).toBeLessThan(allCards.indexOf(card2));

    // カードを並べ替える
    await page.goto("/edit?base=alice.test");
    const card1Locator = page.locator('[data-testid="sortable-card"]', {
      hasText: card1,
    });
    const card2Locator = page.locator('[data-testid="sortable-card"]', {
      hasText: card2,
    });
    await card1Locator
      .getByTestId("sortable-card__handle")
      .dragTo(card2Locator);

    // 保存ボタン押下、Firehose反映待ち
    await page.getByTestId("board-viewer__submit").click();
    await page.waitForTimeout(1000);

    // 閲覧ページで順番を確認
    await page.goto("/board/alice.test");
    await expect(page.locator(`text=${card1}`)).toBeVisible();
    await expect(page.locator(`text=${card2}`)).toBeVisible();
    const sortedCards = await page
      .getByTestId("sortable-card")
      .allTextContents();
    expect(sortedCards.indexOf(card1)).toBeGreaterThan(
      sortedCards.indexOf(card2),
    );
  });
});
