import { http, HttpResponse } from "msw";

import { UserFactory } from "~/.server/factories/user";
import { server } from "~/mocks/server";

import { userService } from ".";

const dummyBlueskyProfile = {
  did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
  handle: "example.com",
  displayName: "Alice",
  associated: {
    lists: 1,
    feedgens: 1,
    labeler: false,
  },
  labels: [],
  description: "Test user 1",
  indexedAt: "2024-07-21T08:19:48.394Z",
  followersCount: 2,
  followsCount: 2,
  postsCount: 42,
};

describe("userService", () => {
  describe("findUser", () => {
    test("didを指定してユーザーを検索できる", async () => {
      // arrange
      const user = await UserFactory.create();
      // act
      const actual = await userService.findOrFetchUser({
        handleOrDid: user.did,
      });
      // assert
      expect(actual).toEqual(user);
    });
    test("handleを指定してユーザーを検索できる", async () => {
      // arrange
      const user = await UserFactory.create();
      // act
      const actual = await userService.findOrFetchUser({
        handleOrDid: user.handle,
      });
      // assert
      expect(actual).toEqual(user);
    });
    test("DBにユーザーがいないとき、Blueskyから取得して作成できる", async () => {
      // arrange
      server.use(
        http.get(
          "https://public.api.example.com/xrpc/app.bsky.actor.getProfile",
          () => HttpResponse.json(dummyBlueskyProfile),
        ),
      );
      // act
      const actual = await userService.findOrFetchUser({
        handleOrDid: "example.com",
      });
      // assert
      expect(actual).toEqual({
        avatar: null,
        description: "Test user 1",
        did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
        displayName: "Alice",
        handle: "example.com",
      });
    });
    test("DBにユーザーがなく、Blueskyから取得できないときnullを返す", async () => {
      // arrange
      server.use(
        http.get(
          "https://public.api.example.com/xrpc/app.bsky.actor.getProfile",
          () => HttpResponse.json("", { status: 500 }),
        ),
      );
      // act
      const actual = await userService.findOrFetchUser({
        handleOrDid: "notfound.example.com",
      });
      // assert
      expect(actual).toBeNull();
    });
  });
});
