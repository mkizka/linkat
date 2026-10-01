import { resolveTxt } from "node:dns/promises";

import { delay, http, HttpResponse } from "msw";

import { server } from "~/mocks/server";

import { createHandleResolver } from "./handleResolver";

vi.mock("node:dns/promises");

const did = "did:plc:dfbe2uvzisfdxwscnwcxdta6";

const wellKnownUrl = "https://alice.test/.well-known/atproto-did";

const dnsError = (code: string) =>
  Object.assign(new Error(`queryTxt ${code}`), { code });

describe("handleResolver", () => {
  test("DNSのTXTレコードからDIDを解決できる", async () => {
    // arrange
    vi.mocked(resolveTxt).mockResolvedValue([[`did=${did}`]]);
    server.use(
      http.get(wellKnownUrl, () => new HttpResponse(null, { status: 404 })),
    );
    // act
    const actual = await createHandleResolver().resolve("alice.test");
    // assert
    expect(actual).toBe(did);
  });
  test("DNSにレコードが無いとき、well-knownからDIDを解決できる", async () => {
    // arrange
    vi.mocked(resolveTxt).mockRejectedValue(dnsError("ENOTFOUND"));
    server.use(http.get(wellKnownUrl, () => HttpResponse.text(did)));
    // act
    const actual = await createHandleResolver().resolve("alice.test");
    // assert
    expect(actual).toBe(did);
  });
  test("DNSにもwell-knownにもDIDが無いときnullを返す", async () => {
    // arrange
    vi.mocked(resolveTxt).mockRejectedValue(dnsError("ENODATA"));
    server.use(
      http.get(wellKnownUrl, () => new HttpResponse(null, { status: 404 })),
    );
    // act
    const actual = await createHandleResolver().resolve("alice.test");
    // assert
    expect(actual).toBeNull();
  });
  test("well-knownに接続できないときnullを返す", async () => {
    // arrange
    vi.mocked(resolveTxt).mockRejectedValue(dnsError("ENOTFOUND"));
    server.use(http.get(wellKnownUrl, () => HttpResponse.error()));
    // act
    const actual = await createHandleResolver().resolve("alice.test");
    // assert
    expect(actual).toBeNull();
  });
  test("DNSが一時的に失敗しても、well-knownからDIDを解決できる", async () => {
    // arrange
    vi.mocked(resolveTxt).mockRejectedValue(dnsError("ETIMEOUT"));
    server.use(http.get(wellKnownUrl, () => HttpResponse.text(did)));
    // act
    const actual = await createHandleResolver().resolve("alice.test");
    // assert
    expect(actual).toBe(did);
  });
  test("DNSが一時的に失敗し、well-knownにDIDが無いとき例外を投げる", async () => {
    // arrange
    vi.mocked(resolveTxt).mockRejectedValue(dnsError("ETIMEOUT"));
    server.use(
      http.get(wellKnownUrl, () => new HttpResponse(null, { status: 404 })),
    );
    // act
    const actual = createHandleResolver().resolve("alice.test");
    // assert
    await expect(actual).rejects.toThrow(
      "DNSでalice.testを解決できませんでした",
    );
  });
  test("well-knownが5xxを返すとき例外を投げる", async () => {
    // arrange
    vi.mocked(resolveTxt).mockRejectedValue(dnsError("ENOTFOUND"));
    server.use(
      http.get(wellKnownUrl, () => new HttpResponse(null, { status: 503 })),
    );
    // act
    const actual = createHandleResolver().resolve("alice.test");
    // assert
    await expect(actual).rejects.toThrow("HTTP 503");
  });
  test("well-knownがタイムアウトしたとき例外を投げる", async () => {
    // arrange
    vi.mocked(resolveTxt).mockRejectedValue(dnsError("ENOTFOUND"));
    server.use(
      http.get(wellKnownUrl, async () => {
        await delay("infinite");
        return HttpResponse.text(did);
      }),
    );
    // act
    const actual = createHandleResolver().resolve("alice.test");
    // assert
    await expect(actual).rejects.toThrow("タイムアウトしました");
  });
});
