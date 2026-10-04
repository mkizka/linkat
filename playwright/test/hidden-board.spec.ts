import { Client } from "pg";

import { expect, test } from "./fixtures";

const deactivate = async (handle: string, status: string | null) => {
  const client = new Client(process.env.DATABASE_URL);
  await client.connect();
  try {
    await client.query(
      `UPDATE "User" SET active = false, status = $1 WHERE handle = $2`,
      [status, handle],
    );
  } finally {
    await client.end();
  }
};

test.describe("非表示のボード", () => {
  test("非表示になった理由を表示する", async ({
    page,
    login,
    account,
    size,
  }) => {
    test.skip(size === "large", "DBを直接書き換えるのでmediumのみ");

    await test.step("ボードを保存する", async () => {
      await login();
      await page.getByTestId("board-viewer__submit").click();
      await page.waitForURL((url) => url.pathname === `/${account.handle}`);
    });

    for (const [status, message] of [
      ["takendown", "このボードは表示できません: takendown"],
      ["throttled", "このボードは表示できません: throttled"],
      [null, "このボードは表示できません"],
    ] as const) {
      await test.step(`status=${status}の理由を表示する`, async () => {
        await deactivate(account.handle, status);
        await page.goto(`/${account.handle}?lng=ja`);
        await expect(page.getByTestId("hidden-board__message")).toHaveText(
          message,
        );
      });
    }

    await test.step("OG画像は404にする", async () => {
      const response = await page.request.get(`/${account.handle}/og`);
      expect(response.status()).toBe(404);
    });
  });
});
