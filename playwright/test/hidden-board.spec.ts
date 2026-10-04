import { Client } from "pg";

import { expect, test } from "./fixtures";

const setStatus = async (handle: string, status: string) => {
  const client = new Client(process.env.DATABASE_URL);
  await client.connect();
  try {
    await client.query(`UPDATE "User" SET status = $1 WHERE handle = $2`, [
      status,
      handle,
    ]);
  } finally {
    await client.end();
  }
};

test.describe("非表示のボード", () => {
  test("accountイベントの理由ごとに非表示の理由を表示する", async ({
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

    const cases = [
      ["suspended", "このアカウントは停止されているため"],
      ["deleted", "このアカウントは削除されたため"],
      ["deactivated", "このアカウントは無効化されているため"],
      ["inactive", "このアカウントは現在利用できないため"],
    ] as const;
    for (const [status, message] of cases) {
      await test.step(`${status}の理由を表示する`, async () => {
        await setStatus(account.handle, status);
        await page.goto(`/${account.handle}?lng=ja`);
        await expect(page.getByTestId("hidden-board__message")).toContainText(
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
