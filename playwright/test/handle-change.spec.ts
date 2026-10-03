import { z } from "zod";

import { PORTS } from "../server/constants";
import { expect, test } from "./fixtures";

const xrpc = async (nsid: string, body: unknown, accessJwt?: string) => {
  const response = await fetch(`http://localhost:${PORTS.pds}/xrpc/${nsid}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessJwt && { Authorization: `Bearer ${accessJwt}` }),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`${nsid}に失敗しました: ${await response.text()}`);
  }
  return response;
};

test.describe("ハンドルの変更", () => {
  test("ハンドルを変更して保存すると新しいハンドルのURLになる", async ({
    page,
    login,
    account,
    size,
  }) => {
    test.skip(size === "large", "実アカウントのハンドルは変更できない");
    const text = crypto.randomUUID();
    const newHandle = `u${crypto.randomUUID().slice(0, 8)}.test`;

    await test.step("ログインしてカードを保存", async () => {
      await login();
      await page.getByTestId("card-form-modal__button").click();
      await page.getByTestId("card-form__url").fill("https://example.com");
      await page.getByTestId("card-form__text").fill(text);
      await page.getByTestId("card-form__submit").click();
      await page.getByTestId("board-viewer__submit").click();
      await page.waitForURL((url) => url.pathname === `/${account.handle}`);
    });

    await test.step("PDSでハンドルを変更", async () => {
      const session = await xrpc("com.atproto.server.createSession", {
        identifier: account.handle,
        password: account.password,
      });
      const { accessJwt } = z
        .object({ accessJwt: z.string() })
        .parse(await session.json());
      await xrpc(
        "com.atproto.identity.updateHandle",
        { handle: newHandle },
        accessJwt,
      );
    });

    await test.step("再度保存すると新しいハンドルで表示される", async () => {
      await page.goto("/edit");
      await page.getByTestId("board-viewer__submit").click();
      await page.waitForURL((url) => url.pathname === `/${newHandle}`);
      await page.getByTestId("show-modal__close").click();
      await expect(page.getByText(`@${newHandle}`)).toBeVisible();
    });

    await test.step("古いハンドルのURLは404になる", async () => {
      const response = await page.goto(`/${account.handle}`);
      expect(response?.status()).toBe(404);
    });
  });
});
