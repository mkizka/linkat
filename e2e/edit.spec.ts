import { test } from "@playwright/test";

const DUMMY_EXPIRED_USER = JSON.stringify({
  profile: {},
  session: {
    accessJwt: "expired",
    refreshJwt: "expired",
    handle: "alice.test",
    did: "did:plc:prh5i45qtb3sck6suspbccon",
    email: "alice@test.com",
    emailConfirmed: false,
    active: true,
  },
  service: "http://localhost:2583/",
});

test.describe("編集", () => {
  test("非ログイン時はトップにリダイレクト", async ({ page }) => {
    await page.goto("/edit");
    await page.waitForURL((url) => url.pathname === "/");
    await page.waitForTimeout(2000);
  });
  test("ログインが無効な時はトップにリダイレクト", async ({ page }) => {
    await page.goto("/dummy");
    await page.evaluate((user) => {
      localStorage.setItem("user", user);
    }, DUMMY_EXPIRED_USER);
    await page.goto("/edit");
    await page.waitForURL((url) => url.pathname === "/");
    await page.waitForTimeout(2000);
  });
});
