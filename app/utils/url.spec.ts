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

const resolveHandleUrl =
  "https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle";

describe("url", () => {
  describe("URLの種類の判定", () => {
    test.each([
      {
        input: "https://bsky.app/profile/example.com",
        fn: isBlueskyProfileUrl,
        expected: true,
      },
      {
        input: "https://bsky.app/profile/example.com/post/abc",
        fn: isBlueskyProfileUrl,
        expected: false,
      },
      {
        input: "https://bsky.app/profile/example.com/post/abc",
        fn: isBlueskyPostUrl,
        expected: true,
      },
      {
        input: "https://bsky.app/profile/example.com/feed/abc",
        fn: isBlueskyPostUrl,
        expected: false,
      },
      {
        input: "https://bsky.app/profile/example.com/feed/abc",
        fn: isBlueskyFeedUrl,
        expected: true,
      },
      {
        input: "https://bsky.app/profile/example.com/post/abc",
        fn: isBlueskyFeedUrl,
        expected: false,
      },
      {
        input: "https://x.com/example",
        fn: isTwitterProfileUrl,
        expected: true,
      },
      {
        input: "https://twitter.com/example",
        fn: isTwitterProfileUrl,
        expected: true,
      },
      {
        input: "https://x.com/example/status/1",
        fn: isTwitterProfileUrl,
        expected: false,
      },
      {
        input: "https://github.com/example",
        fn: isGitHubProfileUrl,
        expected: true,
      },
      {
        input: "https://github.com/example/repo",
        fn: isGitHubProfileUrl,
        expected: false,
      },
    ])("$fn.name($input) は $expected を返す", ({ input, fn, expected }) => {
      // arrange
      const url = new URL(input);
      // act
      const actual = fn(url);
      // assert
      expect(actual).toBe(expected);
    });
  });

  describe("resolveHandleIfNeeded", () => {
    test("投稿URLのハンドルをDIDに変換する", async () => {
      // arrange
      server.use(
        http.get(resolveHandleUrl, () =>
          HttpResponse.json({ did: "did:plc:example" }),
        ),
      );
      // act
      const actual = await resolveHandleIfNeeded(
        "https://bsky.app/profile/example.com/post/abc",
      );
      // assert
      expect(actual).toBe("https://bsky.app/profile/did:plc:example/post/abc");
    });
    test("フィードURLのハンドルをDIDに変換する", async () => {
      // arrange
      server.use(
        http.get(resolveHandleUrl, () =>
          HttpResponse.json({ did: "did:plc:example" }),
        ),
      );
      // act
      const actual = await resolveHandleIfNeeded(
        "https://bsky.app/profile/example.com/feed/abc",
      );
      // assert
      expect(actual).toBe("https://bsky.app/profile/did:plc:example/feed/abc");
    });
    test("すでにDIDのURLはそのまま返す", async () => {
      // arrange
      const input = "https://bsky.app/profile/did:plc:example/post/abc";
      // act
      const actual = await resolveHandleIfNeeded(input);
      // assert
      expect(actual).toBe(input);
    });
    test("投稿・フィード以外のURLはそのまま返す", async () => {
      // arrange
      const input = "https://example.com/profile/example.com/post/abc";
      // act
      const actual = await resolveHandleIfNeeded(input);
      // assert
      expect(actual).toBe(input);
    });
    test("ハンドルの形式が不正ならそのまま返す", async () => {
      // arrange
      const input = "https://bsky.app/profile/invalid/post/abc";
      // act
      const actual = await resolveHandleIfNeeded(input);
      // assert
      expect(actual).toBe(input);
    });
    test("ハンドルの解決に失敗したらそのまま返す", async () => {
      // arrange
      server.use(
        http.get(resolveHandleUrl, () =>
          HttpResponse.json({ error: "InvalidRequest" }, { status: 400 }),
        ),
      );
      const input = "https://bsky.app/profile/example.com/post/abc";
      // act
      const actual = await resolveHandleIfNeeded(input);
      // assert
      expect(actual).toBe(input);
    });
  });

  describe("atUri", () => {
    test("投稿URLをAT URIに変換する", () => {
      // arrange
      const url = new URL("https://bsky.app/profile/did:plc:example/post/abc");
      // act
      const actual = atUri(url, "app.bsky.feed.post");
      // assert
      expect(actual).toBe("at://did:plc:example/app.bsky.feed.post/abc");
    });
  });
});
