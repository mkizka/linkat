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

    const getRecord = (collection: string, rkey: string) =>
      fetch(
        `http://localhost:${PORTS.pds}/xrpc/com.atproto.repo.getRecord?${new URLSearchParams(
          { repo: did, collection, rkey },
        )}`,
      );
    let oldLinkUri = "";

    await test.step("Linkatを通さずPDSにレコードを書く", async () => {
      const response = await xrpc(
        "com.atproto.repo.createRecord",
        {
          repo: did,
          collection: "app.bsky.actor.link",
          record: {
            $type: "app.bsky.actor.link",
            url: "https://example.com/old",
            createdAt: new Date().toISOString(),
          },
        },
        accessJwt,
      );
      const oldLinkRef = z
        .object({ uri: z.string(), cid: z.string() })
        .parse(await response.json());
      oldLinkUri = oldLinkRef.uri;
      await xrpc(
        "com.atproto.repo.putRecord",
        {
          repo: did,
          collection: "app.bsky.actor.profile",
          rkey: "self",
          record: {
            $type: "app.bsky.actor.profile",
            displayName: "名前",
            links: [oldLinkRef],
          },
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

    await test.step("ログインしてから試験機能を有効にする", async () => {
      await login();
      await page.goto("/export");
      await expect(page).toHaveURL((url) => url.pathname === "/");
      await page.goto("/experimental");
      await expect(page.getByTestId("index__export-link")).toBeVisible();
    });

    await test.step("書き出し画面を開く", async () => {
      await page.getByTestId("index__export-link").click();
    });

    const openAuthorizePage = async () => {
      await expect(page.getByTestId("export-reauth__title")).toBeVisible();
      await page.getByTestId("export-reauth__submit").click();
      await page.waitForURL((url) => url.pathname === "/oauth/authorize");
      const password = page.locator("[name='password']");
      const denyButton = page.locator("button", { hasText: "Deny access" });
      await expect(password.or(denyButton)).toBeVisible();
      if (await password.isVisible()) {
        await password.fill(account.password);
        await page.locator("button", { hasText: "Sign in" }).click();
      }
    };

    await test.step("書き込みを拒否すると書き出し画面に戻る", async () => {
      await openAuthorizePage();
      await page.locator("button", { hasText: "Deny access" }).click();
      await page.waitForURL((url) => url.pathname === "/export");
      await expect(
        page.getByTestId("toaster").locator(".alert-error"),
      ).toBeVisible();
    });

    await test.step("書き込みを許可して再ログインする", async () => {
      await openAuthorizePage();
      await page.locator("button", { hasText: "Authorize" }).click();
      await page.waitForURL((url) => url.pathname === "/export");
    });

    await test.step("カードを選んで書き出す", async () => {
      await expect(page.getByTestId("export__replace-warning")).toBeVisible();
      await expect(page.getByTestId("export__count")).toHaveText("2 / 10");
      await page.getByTestId("select-card").filter({ hasText: "B" }).click();
      await page.getByTestId("export__submit").click();
      await expect(page.getByTestId("export-done__title")).toBeVisible();
    });

    await test.step("PDSのプロフィールのリンクが置き換わっている", async () => {
      const response = await getRecord("app.bsky.actor.profile", "self");
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
      expect(value.links[0]?.uri).not.toBe(oldLinkUri);
    });

    await test.step("既存のリンクのレコードが削除されている", async () => {
      const response = await getRecord(
        "app.bsky.actor.link",
        oldLinkUri.split("/").at(-1) ?? "",
      );
      expect(response.status).toBe(400);
    });
  });
});
