import type { Dialog } from "@playwright/test";

import { expect, test } from "./fixtures";

test.describe("編集(離脱確認)", () => {
  test("変更があるときだけ編集ページから離れるときに確認する", async ({
    page,
    login,
  }) => {
    const submit = page.getByTestId("edit-bar__submit");
    const leaveDialog = page.locator("dialog[open]");
    const openEdit = async () => {
      await page.getByTestId("index__edit-link").click();
      await page.waitForURL((url) => url.pathname === "/edit");
      await expect(submit).toBeVisible();
    };
    const addCard = async () => {
      await page.getByTestId("card-form-modal__button").click();
      await page.getByTestId("card-form__text").fill("text");
      await page.getByTestId("card-form__submit").click();
    };

    await test.step("トップページから編集ページに移る", async () => {
      await login();
      await openEdit();
    });

    await test.step("変更がなければ確認なしで戻る", async () => {
      await page.evaluate(() => history.back());
      await page.waitForURL((url) => url.pathname === "/");
    });

    await test.step("変更があると戻るときに確認を出す", async () => {
      await openEdit();
      await addCard();
      let nativeConfirmed = false;
      const stay = async (dialog: Dialog) => {
        nativeConfirmed = true;
        await dialog.dismiss();
      };
      page.once("dialog", stay);
      await page.evaluate(() => history.back());
      await expect
        .poll(async () => nativeConfirmed || (await leaveDialog.isVisible()))
        .toBe(true);
      page.off("dialog", stay);
    });

    await test.step("編集を続けると留まる", async () => {
      if (await leaveDialog.isVisible()) {
        await leaveDialog.getByTestId("confirm-dialog__cancel").click();
        await expect(leaveDialog).toBeHidden();
      }
      await expect(page).toHaveURL((url) => url.pathname === "/edit");
      await expect(submit).toBeVisible();
    });

    await test.step("リロードすると標準の確認を出す", async () => {
      const dialog = page.waitForEvent("dialog");
      const reload = page.reload();
      expect((await dialog).type()).toBe("beforeunload");
      await (await dialog).accept();
      await reload;
      await expect(submit).toBeVisible();
    });

    await test.step("破棄すると移る", async () => {
      await addCard();
      await page.getByTestId("edit-bar__cancel").click();
      await leaveDialog.getByTestId("confirm-dialog__confirm").click();
      await page.waitForURL((url) => url.pathname === "/");
    });
  });
});
