import { http, HttpResponse } from "msw";

import type { ProfileViewDetailed } from "~/generated/app/bsky/actor/defs";
import { server } from "~/mocks/server";
import { UserFactory } from "~/server/factories/user";
import { db } from "~/server/infrastructure/drizzle";
import { userBskyRepositoryFactory } from "~/server/infrastructure/userBskyRepository";
import { userDbRepositoryFactory } from "~/server/infrastructure/userDbRepository";

import { userRepositoryFactory } from "./userRepository";

const userRepository = userRepositoryFactory({
  userDbRepository: userDbRepositoryFactory({ db }),
  userBskyRepository: userBskyRepositoryFactory(),
});

const dummyBlueskyProfile = {
  did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
  handle: "example.com",
  displayName: "Alice",
  avatar: "https://example.com/avatar.png",
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
} satisfies ProfileViewDetailed;

describe("userRepository", () => {
  describe("findByHandleOrDid", () => {
    test("didを指定してユーザーを検索できる", async () => {
      // arrange
      const user = await UserFactory.create();
      // act
      const actual = await userRepository.findByHandleOrDid(user.did);
      // assert
      expect(actual).toEqual(user);
    });
    test("handleを指定してユーザーを検索できる", async () => {
      // arrange
      const user = await UserFactory.create();
      // act
      const actual = await userRepository.findByHandleOrDid(user.handle);
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
      const actual = await userRepository.findByHandleOrDid("example.com");
      // assert
      expect(actual).toEqual({
        avatar: "https://example.com/avatar.png",
        description: "Test user 1",
        did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
        displayName: "Alice",
        handle: "example.com",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
    test("DBにユーザーがいて最終更新から一定時間経過している場合、Blueskyから取得して作成する", async () => {
      // arrange
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-01T00:10:00.000Z"));
      await UserFactory.create({
        did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      });
      server.use(
        http.get(
          "https://public.api.example.com/xrpc/app.bsky.actor.getProfile",
          () => HttpResponse.json(dummyBlueskyProfile),
        ),
      );
      // act
      const actual = await userRepository.findByHandleOrDid(
        "did:plc:dfbe2uvzisfdxwscnwcxdta6",
      );
      // assert
      expect(actual).toEqual({
        avatar: "https://example.com/avatar.png",
        description: "Test user 1",
        did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
        displayName: "Alice",
        handle: "example.com",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:10:00.000Z"),
      });
    });
    test("DBにユーザーがいて最終更新から一定時間経過しているが、Blueskyからも取得出来なかった場合、そのまま返す", async () => {
      // arrange
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-01T00:10:00.000Z"));
      const user = await UserFactory.create({
        did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      });
      server.use(
        http.get(
          "https://public.api.example.com/xrpc/app.bsky.actor.getProfile",
          () => HttpResponse.json("", { status: 500 }),
        ),
      );
      // act
      const actual = await userRepository.findByHandleOrDid(
        "did:plc:dfbe2uvzisfdxwscnwcxdta6",
      );
      // assert
      expect(actual).toEqual(user);
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
      const actual = await userRepository.findByHandleOrDid(
        "notfound.example.com",
      );
      // assert
      expect(actual).toBeNull();
    });
  });
});
