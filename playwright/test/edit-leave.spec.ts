import { expect, test } from "./fixtures";

test.describe("編集(離脱確認)", () => {
  test("編集ページから離れるときに確認する", async ({ page, login }) => {
    const submit = page.getByTestId("board-viewer__submit");
    const goBack = async (accept: boolean) => {
      const dialog = page.waitForEvent("dialog");
      await page.evaluate(() => history.back());
      await (accept ? (await dialog).accept() : (await dialog).dismiss());
    };
    const openEdit = async () => {
      await page.getByTestId("index__edit-link").click();
      await page.waitForURL((url) => url.pathname === "/edit");
      await expect(submit).toBeVisible();
    };

    await test.step("トップページから編集ページに移る", async () => {
      await login();
      await page.goto("/");
      await openEdit();
    });

    await test.step("戻るのをキャンセルすると留まる", async () => {
      await goBack(false);
      await expect(page).toHaveURL((url) => url.pathname === "/edit");
      await expect(submit).toBeVisible();
    });

    await test.step("戻るのを承諾すると移る", async () => {
      await goBack(true);
      await page.waitForURL((url) => url.pathname === "/");
    });

    await test.step("リロードすると確認を出す", async () => {
      await openEdit();
      const dialog = page.waitForEvent("dialog");
      const reload = page.reload();
      expect((await dialog).type()).toBe("beforeunload");
      await (await dialog).accept();
      await reload;
      await expect(submit).toBeVisible();
    });
  });
});
