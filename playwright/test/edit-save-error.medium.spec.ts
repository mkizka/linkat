import { z } from "zod";

import { PORTS } from "../server/constants";
import { expect, test } from "./fixtures";

// アカウントを停止してPDSへの書き込みを失敗させる
const deactivateAccount = async (account: {
  handle: string;
  password: string;
}) => {
  const pds = `http://localhost:${PORTS.pds}/xrpc`;
  const session = await fetch(`${pds}/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: account.handle,
      password: account.password,
    }),
  });
  const { accessJwt } = z
    .object({ accessJwt: z.string() })
    .parse(await session.json());
  const response = await fetch(`${pds}/com.atproto.server.deactivateAccount`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessJwt}`,
    },
    body: "{}",
  });
  if (!response.ok) {
    throw new Error(`アカウントの停止に失敗しました: ${await response.text()}`);
  }
};

test("PDSへの保存に失敗したら編集ページに留まりエラーを表示する", async ({
  page,
  login,
}) => {
  page.on("dialog", (dialog) => dialog.accept());
  const text = crypto.randomUUID();
  const card = page.getByTestId("sortable-card").filter({ hasText: text });

  const account = await login();

  await test.step("カードを追加", async () => {
    await page.getByTestId("card-form-modal__button").click();
    await page.getByTestId("card-form__url").fill("https://example.com");
    await page.getByTestId("card-form__text").fill(text);
    await page.getByTestId("card-form__submit").click();
    await expect(card).toBeVisible();
  });

  await test.step("PDSへの書き込みが失敗する状態で保存する", async () => {
    await deactivateAccount(account);
    await page.getByTestId("board-viewer__submit").click();
    await expect(
      page.getByTestId("toaster").locator(".alert-error"),
    ).toHaveText("Failed to save the board");
    await expect(page).toHaveURL((url) => url.pathname === "/edit");
    await expect(card).toBeVisible();
  });

  await test.step("再読み込みするとカードが保存されていない", async () => {
    await page.reload();
    await expect(page.getByTestId("board-viewer__submit")).toBeVisible();
    await expect(card).not.toBeVisible();
  });
});
