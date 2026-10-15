import { createSession, expect, test, xrpc } from "./fixtures";

const patterns = [
  { hasProfile: true, hasBoard: true },
  { hasProfile: true, hasBoard: false },
  { hasProfile: false, hasBoard: true },
  { hasProfile: false, hasBoard: false },
];

test.describe("同期", () => {
  for (const { hasProfile, hasBoard } of patterns) {
    test(`PDSのプロフィールが${hasProfile ? "あり" : "なし"}、ボードが${hasBoard ? "あり" : "なし"}なら、ログイン後のトップでその状態で取り込む`, async ({
      page,
      login,
      account,
      size,
    }) => {
      test.skip(size === "large", "dev-envのPDSを操作するため");
      const displayName = `Name ${crypto.randomUUID().slice(0, 8)}`;
      const text = `PDS. ${crypto.randomUUID()}`;

      await test.step("Linkatを通さずPDSにレコードを書く", async () => {
        const { did, accessJwt } = await createSession(account);
        if (hasProfile) {
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
        }
        if (hasBoard) {
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
        }
      });

      await test.step("ログインするとトップで取り込み、/editで編集できる", async () => {
        await login();
        await expect(
          page.getByText(`@${account.handle}`, { exact: true }),
        ).toBeVisible();
        if (hasProfile) {
          await expect(
            page.getByRole("heading", { name: displayName }),
          ).toBeVisible();
        }
        if (hasBoard) {
          await expect(
            page.getByTestId("toaster").locator(".alert-success"),
          ).toBeVisible();
        }
        await page.goto("/edit");
        if (hasBoard) {
          await expect(
            page.locator('[data-testid="board-card"]', { hasText: text }),
          ).toBeVisible();
        } else {
          await expect(page.getByTestId("board-card")).toHaveCount(0);
        }
      });
    });
  }

  test("PDSから取り込んだボードを保存できる", async ({
    page,
    login,
    account,
    size,
  }) => {
    test.skip(size === "large", "dev-envのPDSを操作するため");
    const text = `PDS. ${crypto.randomUUID()}`;
    const card = page.locator('[data-testid="board-card"]', {
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
