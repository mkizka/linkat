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
  test("アカウントを無効化するとボードが404になる", async ({
    page,
    login,
    account,
  }) => {
    await test.step("ボードを保存", async () => {
      await login();
      await page.getByTestId("board-viewer__submit").click();
      await page.waitForURL((url) => url.pathname === `/${account.handle}`);
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

    await test.step("ボードが404になる", async () => {
      await expect(async () => {
        const response = await page.goto(`/${account.handle}`);
        expect(response?.status()).toBe(404);
      }).toPass();
      await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    });
  });
});
