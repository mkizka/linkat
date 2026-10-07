import { z } from "zod";

import { PORTS } from "../server/constants";
import { expect, test } from "./fixtures";

const xrpc = async (nsid: string, body: object, accessJwt?: string) => {
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

test.describe("Jetstream", () => {
  test.skip(({ size }) => size === "large", "dev-envのPDSを操作するため");

  test("アカウントを無効化するとボードが非表示になる", async ({
    page,
    login,
    account,
  }) => {
    await test.step("ボードを保存", async () => {
      await login();
      await page.getByTestId("board-viewer__submit").click();
      await page.waitForURL((url) => url.pathname !== "/edit");
    });

    await test.step("PDSでアカウントを無効化", async () => {
      const session = await xrpc("com.atproto.server.createSession", {
        identifier: account.handle,
        password: account.password,
      });
      const { accessJwt } = z
        .object({ accessJwt: z.string() })
        .parse(await session.json());
      await xrpc("com.atproto.server.deactivateAccount", {}, accessJwt);
    });

    await test.step("ボードの代わりにstatusを表示する", async () => {
      await expect(async () => {
        await page.goto(`/${account.handle}?lng=ja`);
        await expect(page.getByTestId("hidden-board__message")).toHaveText(
          "このボードは表示できません: deactivated",
          { timeout: 1000 },
        );
      }).toPass();
    });

    await test.step("OG画像は404にする", async () => {
      const response = await page.request.get(`/${account.handle}/og`);
      expect(response.status()).toBe(404);
    });
  });
});
