import { z } from "zod";

import { PORTS } from "../../dev-env/constants";
import { createSession, expect, test, xrpc } from "./fixtures";

test.describe("カードの検証", () => {
  test.skip(({ size }) => size === "large", "dev-envのPDSを操作するため");

  test("ルールを満たさないカードは写しに入らず、保存するとPDSからも消える", async ({
    page,
    login,
    account,
  }) => {
    const urlCard = { url: "https://example.com", text: crypto.randomUUID() };
    const textCard = { text: crypto.randomUUID() };
    const invalidCards = [
      { url: "mailto:example@example.com", text: crypto.randomUUID() },
      { url: "https://example.com", text: crypto.randomUUID(), emoji: "ab" },
      { emoji: "😀" },
    ];
    const session = await createSession(account);

    await test.step("Linkatを通さずPDSにボードを書く", async () => {
      await xrpc(
        "com.atproto.repo.putRecord",
        {
          repo: session.did,
          collection: "blue.linkat.board",
          rkey: "self",
          record: {
            $type: "blue.linkat.board",
            cards: [urlCard, ...invalidCards, textCard],
          },
        },
        session.accessJwt,
      );
    });

    await test.step("ルールを満たすカードだけを取り込む", async () => {
      await login();
      await expect(
        page.locator('[data-testid="sortable-card"]', {
          hasText: textCard.text,
        }),
      ).toBeVisible();
      await expect(page.getByTestId("sortable-card")).toHaveText([
        urlCard.text,
        textCard.text,
      ]);
    });

    await test.step("保存するとPDSにはルールを満たすカードだけが残る", async () => {
      await page.getByTestId("board-viewer__submit").click();
      await page.waitForURL((url) => url.pathname === `/${account.handle}`);
      const params = new URLSearchParams({
        repo: session.did,
        collection: "blue.linkat.board",
        rkey: "self",
      });
      const response = await fetch(
        `http://localhost:${PORTS.pds}/xrpc/com.atproto.repo.getRecord?${params}`,
      );
      const { value } = z
        .object({ value: z.object({ cards: z.unknown() }) })
        .parse(await response.json());
      expect(value.cards).toEqual([urlCard, textCard]);
    });
  });

  test("URLもテキストも無いカードは追加できない", async ({ page, login }) => {
    await login();
    await page.getByTestId("card-form-modal__button").click();
    await page.getByTestId("card-form__submit").click();
    await expect(
      page.getByText("Please enter one of the fields"),
    ).toBeVisible();
    await expect(page.getByTestId("sortable-card")).toHaveCount(0);
  });
});
