import { test } from "@playwright/test";

import { resetStorageState } from "./utils";

resetStorageState();

test.describe("編集(リダイレクト)", () => {
  test("非ログイン時はトップにリダイレクト", async ({ page }) => {
    await page.goto("/edit");
    await page.waitForURL((url) => url.pathname === "/login");
    await page.waitForTimeout(2000);
  });
  test("ログインが無効な時はトップにリダイレクト", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await context.addCookies([
      {
        name: "__session",
        value:
          "eyJkaWQiOiJkaWQ6cGxjOnRpd2h6NWdiZTVqZGt2cmdjbHB1Z2oybCJ9.09GaE2lRKbto%2FraoDdda4pGnsQNvsIRfuBHErKE1qU",
        domain: "linkat.localhost",
        path: "/",
      },
    ]);
    await page.goto("/edit");
    await page.waitForURL((url) => url.pathname === "/login");
    await page.waitForTimeout(2000);
  });
});
