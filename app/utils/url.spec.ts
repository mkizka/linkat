import { http, HttpResponse } from "msw";

import { server } from "~/mocks/server";

import {
  atUri,
  isBlueskyFeedUrl,
  isBlueskyPostUrl,
  isBlueskyProfileUrl,
  isGitHubProfileUrl,
  isTwitterProfileUrl,
  resolveHandleIfNeeded,
} from "./url";

describe("isBlueskyProfileUrl", () => {
  test.each`
    url                                                | expected | description
    ${"https://bsky.app/profile/example.com"}          | ${true}  | ${"プロフィールURLならtrue"}
    ${"https://bsky.app/profile/example.com/post/123"} | ${false} | ${"投稿URLはfalse"}
    ${"https://bsky.app/profile/example.com/feed/123"} | ${false} | ${"フィードURLはfalse"}
    ${"https://example.com/profile/example.com"}       | ${false} | ${"ホストが違えばfalse"}
    ${"https://bsky.app/"}                             | ${false} | ${"パスが足りなければfalse"}
  `("$description", ({ url, expected }: { url: string; expected: boolean }) => {
    expect(isBlueskyProfileUrl(new URL(url))).toBe(expected);
  });
});

describe("isBlueskyPostUrl", () => {
  test.each`
    url                                                   | expected | description
    ${"https://bsky.app/profile/example.com/post/123"}    | ${true}  | ${"投稿URLならtrue"}
    ${"https://bsky.app/profile/example.com"}             | ${false} | ${"プロフィールURLはfalse"}
    ${"https://bsky.app/profile/example.com/feed/123"}    | ${false} | ${"フィードURLはfalse"}
    ${"https://example.com/profile/example.com/post/123"} | ${false} | ${"ホストが違えばfalse"}
  `("$description", ({ url, expected }: { url: string; expected: boolean }) => {
    expect(isBlueskyPostUrl(new URL(url))).toBe(expected);
  });
});

describe("isBlueskyFeedUrl", () => {
  test.each`
    url                                                   | expected | description
    ${"https://bsky.app/profile/example.com/feed/123"}    | ${true}  | ${"フィードURLならtrue"}
    ${"https://bsky.app/profile/example.com"}             | ${false} | ${"プロフィールURLはfalse"}
    ${"https://bsky.app/profile/example.com/post/123"}    | ${false} | ${"投稿URLはfalse"}
    ${"https://example.com/profile/example.com/feed/123"} | ${false} | ${"ホストが違えばfalse"}
  `("$description", ({ url, expected }: { url: string; expected: boolean }) => {
    expect(isBlueskyFeedUrl(new URL(url))).toBe(expected);
  });
});

describe("isTwitterProfileUrl", () => {
  test.each`
    url                                    | expected | description
    ${"https://twitter.com/example"}       | ${true}  | ${"twitter.comのプロフィールURLならtrue"}
    ${"https://x.com/example"}             | ${true}  | ${"x.comのプロフィールURLならtrue"}
    ${"https://twitter.com/example/extra"} | ${false} | ${"パスが多ければfalse"}
    ${"https://example.com/example"}       | ${false} | ${"ホストが違えばfalse"}
  `("$description", ({ url, expected }: { url: string; expected: boolean }) => {
    expect(isTwitterProfileUrl(new URL(url))).toBe(expected);
  });
});

describe("isGitHubProfileUrl", () => {
  test.each`
    url                                   | expected | description
    ${"https://github.com/example"}       | ${true}  | ${"GitHubのプロフィールURLならtrue"}
    ${"https://github.com/example/extra"} | ${false} | ${"パスが多ければfalse"}
    ${"https://example.com/example"}      | ${false} | ${"ホストが違えばfalse"}
  `("$description", ({ url, expected }: { url: string; expected: boolean }) => {
    expect(isGitHubProfileUrl(new URL(url))).toBe(expected);
  });
});

describe("atUri", () => {
  test("URLからat-uriを組み立てられる", () => {
    // arrange
    const url = new URL(
      "https://bsky.app/profile/did:plc:abcdefg/post/hijklmnop",
    );
    // act
    const actual = atUri(url, "app.bsky.feed.post");
    // assert
    expect(actual).toBe("at://did:plc:abcdefg/app.bsky.feed.post/hijklmnop");
  });
});

describe("resolveHandleIfNeeded", () => {
  test("投稿・フィードURL以外はそのまま返す", async () => {
    // arrange
    const original = "https://example.com";
    // act
    const actual = await resolveHandleIfNeeded(original);
    // assert
    expect(actual).toBe(original);
  });
  test("プロフィールURLはそのまま返す", async () => {
    // arrange
    const original = "https://bsky.app/profile/example.com";
    // act
    const actual = await resolveHandleIfNeeded(original);
    // assert
    expect(actual).toBe(original);
  });
  test("投稿URLがすでにdidの場合はそのまま返す", async () => {
    // arrange
    const original = "https://bsky.app/profile/did:plc:abcdefg/post/123";
    // act
    const actual = await resolveHandleIfNeeded(original);
    // assert
    expect(actual).toBe(original);
  });
  test("投稿URLのhandleをdidに解決する", async () => {
    // arrange
    server.use(
      http.get(
        "https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle",
        ({ request }) => {
          const handle = new URL(request.url).searchParams.get("handle");
          expect(handle).toBe("example.com");
          return HttpResponse.json({ did: "did:plc:abcdefg" });
        },
      ),
    );
    // act
    const actual = await resolveHandleIfNeeded(
      "https://bsky.app/profile/example.com/post/123",
    );
    // assert
    expect(actual).toBe("https://bsky.app/profile/did:plc:abcdefg/post/123");
  });
  test("フィードURLのhandleをdidに解決する", async () => {
    // arrange
    server.use(
      http.get(
        "https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle",
        () => HttpResponse.json({ did: "did:plc:abcdefg" }),
      ),
    );
    // act
    const actual = await resolveHandleIfNeeded(
      "https://bsky.app/profile/example.com/feed/123",
    );
    // assert
    expect(actual).toBe("https://bsky.app/profile/did:plc:abcdefg/feed/123");
  });
  test("不正な形式のhandleの場合は例外を投げる", async () => {
    // arrange
    const original = "https://bsky.app/profile/not a valid handle/post/123";
    // act
    const act = () => resolveHandleIfNeeded(original);
    // assert
    await expect(act()).rejects.toThrow();
  });
});
