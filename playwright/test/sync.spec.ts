import { createSession, expect, test, xrpc } from "./fixtures";

test.describe("同期", () => {
  test.skip(({ size }) => size === "large", "dev-envのPDSを操作するため");

  test("PDSにあるボードを/editを開いたときに取り込む", async ({
    page,
    login,
    account,
  }) => {
    const text = `PDS. ${crypto.randomUUID()}`;
    const card = page.locator('[data-testid="sortable-card"]', {
      hasText: text,
    });

    await test.step("Linkatを通さずPDSにボードを書く", async () => {
      const { did, accessJwt } = await createSession(account);
      await xrpc(
        "com.atproto.repo.putRecord",
        {
          repo: did,
          collection: "blue.linkat.board",
          rkey: "self",
          record: {
            $type: "blue.linkat.board",
            cards: [{ url: "https://example.com", text }],
          },
        },
        accessJwt,
      );
    });

    await test.step("ログインすると取り込んだボードを編集できる", async () => {
      await login();
      await expect(card).toBeVisible();
      await expect(
        page.getByTestId("toaster").locator(".alert-success"),
      ).toBeVisible();
    });

    await test.step("保存するとハンドルのURLに移る", async () => {
      await page.getByTestId("board-viewer__submit").click();
      await page.waitForURL((url) => url.pathname === `/${account.handle}`);
      await page.getByTestId("show-modal__close").click();
      await expect(card).toBeVisible();
    });
  });
});
