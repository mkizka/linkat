import { expect, test } from "./fixtures";

test.describe("想定外のリクエスト", () => {
  test("OPTIONSには許可するメソッドを204で返す", async ({ request }) => {
    const response = await request.fetch("/", { method: "OPTIONS" });
    expect(response.status()).toBe(204);
    expect(response.headers()["allow"]).toBe("GET, HEAD, POST, OPTIONS");
  });

  test("許可しないメソッドには405を返す", async ({ request }) => {
    const response = await request.fetch("/", { method: "PUT" });
    expect(response.status()).toBe(405);
    expect(response.headers()["allow"]).toBe("GET, HEAD, POST, OPTIONS");
  });

  test("ログインにformでないリクエストを送ると400を返す", async ({
    request,
  }) => {
    const response = await request.post("/login", {
      data: { handle: "example.test" },
    });
    expect(response.status()).toBe(400);
  });

  test("編集にformでないリクエストを送ると400を返す", async ({
    page,
    login,
  }) => {
    await login();
    const response = await page.request.post("/edit", {
      data: { board: "{}" },
    });
    expect(response.status()).toBe(400);
  });
});
