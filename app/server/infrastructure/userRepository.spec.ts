import { http, HttpResponse } from "msw";

import type { ProfileViewDetailed } from "~/generated/app/bsky/actor/defs";
import { server } from "~/mocks/server";
import { UserFactory } from "~/server/factories/user";
import { db } from "~/server/infrastructure/drizzle";
import { identityResolverFactory } from "~/server/infrastructure/identityResolver";
import { userBskyRepositoryFactory } from "~/server/infrastructure/userBskyRepository";
import { userDbRepositoryFactory } from "~/server/infrastructure/userDbRepository";

import { userRepositoryFactory } from "./userRepository";

const userRepository = userRepositoryFactory({
  userDbRepository: userDbRepositoryFactory({ db }),
  userBskyRepository: userBskyRepositoryFactory(),
  identityResolver: identityResolverFactory(),
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

const mockResolveHandle = () =>
  server.use(
    http.get("https://example.com/.well-known/atproto-did", () =>
      HttpResponse.text(dummyBlueskyProfile.did),
    ),
  );

const mockIdentity = () => {
  mockResolveHandle();
  server.use(
    http.get(
      `https://plc.example.com/${encodeURIComponent(dummyBlueskyProfile.did)}`,
      () =>
        HttpResponse.json({
          "@context": ["https://www.w3.org/ns/did/v1"],
          id: dummyBlueskyProfile.did,
          alsoKnownAs: ["at://example.com"],
        }),
    ),
  );
};

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
      mockResolveHandle();
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
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2024-01-01T00:10:00.000Z"));
      await UserFactory.create({
        did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      });
      mockIdentity();
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
    test("DBにユーザーがいて最終更新から一定時間経過しているが、プロフィールが取得出来なかった場合、プロフィールはそのまま残す", async () => {
      // arrange
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2024-01-01T00:10:00.000Z"));
      const user = await UserFactory.create({
        did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
        handle: "example.com",
        displayName: "Alice",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      });
      mockIdentity();
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
      expect(actual).toEqual({
        ...user,
        updatedAt: new Date("2024-01-01T00:10:00.000Z"),
      });
    });
    test("DBにユーザーがなく、プロフィールが取得できないときもプロフィールなしで作成する", async () => {
      // arrange
      mockResolveHandle();
      server.use(
        http.get(
          "https://public.api.example.com/xrpc/app.bsky.actor.getProfile",
          () => HttpResponse.json("", { status: 400 }),
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
    test("DBにユーザーがなく、handleが解決できないときnullを返す", async () => {
      // arrange
      server.use(
        http.get("https://notfound.example.com/.well-known/atproto-did", () =>
          HttpResponse.text("", { status: 404 }),
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
