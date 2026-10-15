import { createSession, expect, test, xrpc } from "./fixtures";

test.describe("同期", () => {
  test("PDSにあるプロフィールとボードをログイン後のトップで取り込む", async ({
    page,
    login,
    account,
    size,
  }) => {
    test.skip(size === "large", "dev-envのPDSを操作するため");
    const text = `PDS. ${crypto.randomUUID()}`;
    const displayName = `Name ${crypto.randomUUID().slice(0, 8)}`;
    const card = page.locator('[data-testid="board-card"]', {
      hasText: text,
    });

    await test.step("Linkatを通さずPDSにプロフィールとボードを書く", async () => {
      const { did, accessJwt } = await createSession(account);
      await xrpc(
        "com.atproto.repo.putRecord",
        {
          repo: did,
          collection: "app.bsky.actor.profile",
          rkey: "self",
          record: { $type: "app.bsky.actor.profile", displayName },
        },
        accessJwt,
      );
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

    await test.step("ログインするとトップで取り込み、プロフィールを表示する", async () => {
      await login();
      await expect(
        page.getByTestId("toaster").locator(".alert-success"),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: displayName }),
      ).toBeVisible();
      await expect(
        page.getByText(`@${account.handle}`, { exact: true }),
      ).toBeVisible();
    });

    await test.step("取り込んだボードを編集できる", async () => {
      await page.goto("/edit");
      await expect(card).toBeVisible();
    });

    await test.step("保存するとハンドルのURLに移る", async () => {
      await page.getByTestId("edit-bar__submit").click();
      await page.waitForURL((url) => url.pathname === `/${account.handle}`);
      await page.getByTestId("show-modal__close").click();
      await expect(card).toBeVisible();
    });
  });
});
