import { z } from "zod";

import { PORTS } from "../../dev-env/constants";
import { createSession, expect, test, xrpc } from "./fixtures";

test.describe("Blueskyへの書き出し", () => {
  test("選んだカードをプロフィールのリンクに書き出す", async ({
    page,
    login,
    account,
    size,
  }) => {
    test.skip(size === "large", "dev-envのPDSを操作するため");
    const { did, accessJwt } = await createSession(account);

    await test.step("Linkatを通さずPDSにレコードを書く", async () => {
      await xrpc(
        "com.atproto.repo.putRecord",
        {
          repo: did,
          collection: "app.bsky.actor.profile",
          rkey: "self",
          record: { $type: "app.bsky.actor.profile", displayName: "名前" },
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
            cards: [
              { url: "https://example.com/a", text: "A" },
              { text: "テキストだけ" },
              { url: "https://example.com/b", text: "B" },
            ],
          },
        },
        accessJwt,
      );
    });

    await test.step("ログインしてボードを取り込む", async () => {
      await login();
      await expect(page.getByTestId("index__export-link")).toBeVisible();
    });

    await test.step("カードを選んで書き出す", async () => {
      await page.getByTestId("index__export-link").click();
      await expect(page.getByTestId("export__count")).toHaveText("2 / 10");
      await page.getByTestId("select-card").filter({ hasText: "B" }).click();
      await page.getByTestId("export__submit").click();
      await expect(page.getByTestId("export-done__title")).toBeVisible();
    });

    await test.step("PDSのプロフィールにリンクが書かれている", async () => {
      const response = await fetch(
        `http://localhost:${PORTS.pds}/xrpc/com.atproto.repo.getRecord?${new URLSearchParams(
          {
            repo: did,
            collection: "app.bsky.actor.profile",
            rkey: "self",
          },
        )}`,
      );
      const { value } = z
        .object({
          value: z.object({
            displayName: z.string(),
            links: z.object({ uri: z.string() }).array(),
          }),
        })
        .parse(await response.json());
      expect(value.displayName).toBe("名前");
      expect(value.links).toHaveLength(1);
    });
  });
});
