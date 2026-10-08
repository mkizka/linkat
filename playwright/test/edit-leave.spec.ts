import { expect, test } from "./fixtures";

test.describe("編集(離脱確認)", () => {
  test("編集ページから離れるときに確認する", async ({ page, login }) => {
    const submit = page.getByTestId("board-viewer__submit");
    const leaveWith = async (
      navigate: () => Promise<unknown>,
      accept: boolean,
    ) => {
      const dialog = page.waitForEvent("dialog");
      await navigate();
      await (accept ? (await dialog).accept() : (await dialog).dismiss());
    };
    const clickHome = () =>
      page
        .getByRole("banner")
        .getByRole("link", { name: "Linkat", exact: true })
        .click();
    const goBack = () => page.evaluate(() => history.back());
    const openEdit = async () => {
      await page.getByTestId("index__edit-link").click();
      await page.waitForURL((url) => url.pathname === "/edit");
      await expect(submit).toBeVisible();
    };

    await test.step("ログイン", async () => {
      await login();
      await expect(submit).toBeVisible();
    });

    await test.step("リンクで離れるのをキャンセルすると留まる", async () => {
      await leaveWith(clickHome, false);
      await expect(page).toHaveURL((url) => url.pathname === "/edit");
      await expect(submit).toBeVisible();
    });

    await test.step("リンクで離れるのを承諾すると移る", async () => {
      await leaveWith(clickHome, true);
      await page.waitForURL((url) => url.pathname === "/");
    });

    await test.step("戻るのをキャンセルすると留まる", async () => {
      await openEdit();
      await leaveWith(goBack, false);
      await expect(page).toHaveURL((url) => url.pathname === "/edit");
      await expect(submit).toBeVisible();
    });

    await test.step("戻るのを承諾すると移る", async () => {
      await leaveWith(goBack, true);
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
