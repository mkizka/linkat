import { asDid } from "@atproto/did";
import { http, HttpResponse } from "msw";
import { mock } from "vitest-mock-extended";

import type { ProfileViewDetailed } from "~/generated/app/bsky/actor/defs";
import { server } from "~/mocks/server";
import { BoardFactory } from "~/server/factories/board";
import { UserFactory } from "~/server/factories/user";
import { db } from "~/server/infrastructure/drizzle";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import { userBskyRepositoryFactory } from "~/server/infrastructure/userBskyRepository";
import { userDbRepositoryFactory } from "~/server/infrastructure/userDbRepository";

import { userRepositoryFactory } from "./userRepository";

const identityResolver = mock<IIdentityResolver>();

const userDbRepository = userDbRepositoryFactory({ db });

const userRepository = userRepositoryFactory({
  identityResolver,
  userDbRepository,
  userBskyRepository: userBskyRepositoryFactory({ identityResolver }),
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
    beforeEach(() => {
      identityResolver.resolve.mockResolvedValue({
        did: asDid(dummyBlueskyProfile.did),
        handle: dummyBlueskyProfile.handle,
      });
      server.use(
        http.get(
          "https://public.api.example.com/xrpc/app.bsky.actor.getProfile",
          () => HttpResponse.json(dummyBlueskyProfile),
        ),
      );
    });
    test("didを指定してユーザーを検索できる", async () => {
      // arrange
      const user = await UserFactory.create();
      // act
      const actual = await userRepository.findByHandleOrDid(user.did);
      // assert
      expect(actual).toEqual(user);
    });
    test("handleを指定するとDIDに解決してからユーザーを検索する", async () => {
      // arrange
      const user = await UserFactory.create({ did: dummyBlueskyProfile.did });
      // act
      const actual = await userRepository.findByHandleOrDid("example.com");
      // assert
      expect(actual).toEqual(user);
    });
    test("handleが別のDIDに移っている場合、DBに残った古いDIDのユーザーは返さない", async () => {
      // arrange
      await UserFactory.create({
        did: "did:plc:olduser0000000000000000000",
        handle: "example.com",
      });
      // act
      const actual = await userRepository.findByHandleOrDid("example.com");
      // assert
      expect(actual?.did).toBe(dummyBlueskyProfile.did);
    });
    test("DBにユーザーがいなくてボードがあるとき、Blueskyから取得して保存する", async () => {
      // arrange
      await BoardFactory.create({ userDid: dummyBlueskyProfile.did });
      // act
      const actual = await userRepository.findByHandleOrDid("example.com");
      // assert
      const expected = {
        avatar: "https://example.com/avatar.png",
        description: "Test user 1",
        did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
        displayName: "Alice",
        handle: "example.com",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };
      expect(actual).toEqual(expected);
      expect(
        await userDbRepository.findByDid(asDid(dummyBlueskyProfile.did)),
      ).toEqual(expected);
    });
    test("DBにユーザーがいなくてボードもないとき、Blueskyから取得するが保存しない", async () => {
      // arrange
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
      expect(
        await userDbRepository.findByDid(asDid(dummyBlueskyProfile.did)),
      ).toBeNull();
    });
    test("DBにユーザーがいて最終更新から一定時間経過している場合、Blueskyから取得して更新する", async () => {
      // arrange
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-01T00:10:00.000Z"));
      await UserFactory.create({
        did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      });
      await BoardFactory.create({ userDid: dummyBlueskyProfile.did });
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
    test("プロフィールが取得できなくてもDIDとhandleだけで返す", async () => {
      // arrange
      server.use(
        http.get(
          "https://public.api.example.com/xrpc/app.bsky.actor.getProfile",
          () => HttpResponse.json("", { status: 500 }),
        ),
      );
      // act
      const actual = await userRepository.findByHandleOrDid("example.com");
      // assert
      expect(actual).toEqual({
        avatar: null,
        description: null,
        did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
        displayName: null,
        handle: "example.com",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
    test("DBにユーザーがいて最終更新から一定時間経過しているが、DIDを解決できなかった場合、そのまま返す", async () => {
      // arrange
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-01T00:10:00.000Z"));
      const user = await UserFactory.create({
        did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      });
      identityResolver.resolve.mockResolvedValue(null);
      // act
      const actual = await userRepository.findByHandleOrDid(
        "did:plc:dfbe2uvzisfdxwscnwcxdta6",
      );
      // assert
      expect(actual).toEqual(user);
    });
    test("handleをDIDに解決できないときnullを返す", async () => {
      // arrange
      await UserFactory.create({ handle: "notfound.example.com" });
      identityResolver.resolve.mockResolvedValue(null);
      // act
      const actual = await userRepository.findByHandleOrDid(
        "notfound.example.com",
      );
      // assert
      expect(actual).toBeNull();
    });
  });
});
