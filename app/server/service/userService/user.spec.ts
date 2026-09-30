import { asDid } from "@atproto/did";
import { http, HttpResponse } from "msw";
import { mock } from "vitest-mock-extended";

import type { ProfileViewDetailed } from "~/generated/app/bsky/actor/defs";
import { server } from "~/mocks/server";
import { UserFactory } from "~/server/factories/user";
import { db } from "~/server/infrastructure/drizzle";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import { userBskyRepositoryFactory } from "~/server/infrastructure/userBskyRepository";
import { userDbRepositoryFactory } from "~/server/infrastructure/userDbRepository";

import { userServiceFactory } from "./user";

const identityResolver = mock<IIdentityResolver>();

const userDbRepository = userDbRepositoryFactory({ db });

const userService = userServiceFactory({
  identityResolver,
  userDbRepository,
  userBskyRepository: userBskyRepositoryFactory({ identityResolver }),
});

const did = asDid("did:plc:dfbe2uvzisfdxwscnwcxdta6");

const dummyBlueskyProfile = {
  did,
  handle: "example.com",
  displayName: "Alice",
  avatar: "https://example.com/avatar.png",
  description: "Test user 1",
} satisfies ProfileViewDetailed;

describe("userService", () => {
  beforeEach(() => {
    identityResolver.resolve.mockResolvedValue({
      did,
      handle: "example.com",
    });
  });

  describe("findUser", () => {
    test("DIDを指定するとDBからユーザーを取得する", async () => {
      // arrange
      const user = await UserFactory.create();
      // act
      const actual = await userService.findUser({ handleOrDid: user.did });
      // assert
      expect(actual).toEqual(user);
    });
    test("handleを指定するとDIDに解決してDBからユーザーを取得し、handleは解決したものを使う", async () => {
      // arrange
      const user = await UserFactory.create({ did, handle: "old.example.com" });
      // act
      const actual = await userService.findUser({ handleOrDid: "example.com" });
      // assert
      expect(actual).toEqual({ ...user, handle: "example.com" });
    });
    test("handleが別のDIDに移っている場合、DBに残った古いDIDのユーザーは返さない", async () => {
      // arrange
      await UserFactory.create({ handle: "example.com" });
      // act
      const actual = await userService.findUser({ handleOrDid: "example.com" });
      // assert
      expect(actual).toBeNull();
    });
    test("DBにユーザーがいなければBlueskyに問い合わせずnullを返す", async () => {
      // arrange
      // act
      const actual = await userService.findUser({ handleOrDid: "example.com" });
      // assert
      expect(actual).toBeNull();
    });
    test("handleをDIDに解決できなければnullを返す", async () => {
      // arrange
      identityResolver.resolve.mockResolvedValue(null);
      // act
      const actual = await userService.findUser({ handleOrDid: "example.com" });
      // assert
      expect(actual).toBeNull();
    });
    test("入力が明らかにドメインでなければnullを返す", async () => {
      // arrange
      // act
      const actual = await userService.findUser({
        handleOrDid: "invalid",
      });
      // assert
      expect(actual).toBeNull();
    });
    test("入力がDIDとして不正であればnullを返す", async () => {
      // arrange
      // act
      const actual = await userService.findUser({
        handleOrDid: "did:invalid",
      });
      // assert
      expect(actual).toBeNull();
    });
  });

  describe("syncUser", () => {
    test("DBにユーザーがいなければBlueskyから取得して作成する", async () => {
      // arrange
      server.use(
        http.get(
          "https://public.api.example.com/xrpc/app.bsky.actor.getProfile",
          () => HttpResponse.json(dummyBlueskyProfile),
        ),
      );
      // act
      const actual = await userService.syncUser(did);
      // assert
      const expected = {
        did,
        avatar: "https://example.com/avatar.png",
        description: "Test user 1",
        displayName: "Alice",
        handle: "example.com",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };
      expect(actual).toEqual(expected);
      expect(await userDbRepository.findByDid(did)).toEqual(expected);
    });
    test("DBにユーザーがいればBlueskyから取得して更新する", async () => {
      // arrange
      const existing = await UserFactory.create({
        did,
        handle: "old.example.com",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      });
      server.use(
        http.get(
          "https://public.api.example.com/xrpc/app.bsky.actor.getProfile",
          () => HttpResponse.json(dummyBlueskyProfile),
        ),
      );
      // act
      const actual = await userService.syncUser(did);
      // assert
      expect(actual).toEqual({
        did,
        avatar: "https://example.com/avatar.png",
        description: "Test user 1",
        displayName: "Alice",
        handle: "example.com",
        createdAt: existing.createdAt,
        updatedAt: expect.any(Date),
      });
    });
    test("プロフィールが取得できなくてもDIDとhandleだけで作成する", async () => {
      // arrange
      server.use(
        http.get(
          "https://public.api.example.com/xrpc/app.bsky.actor.getProfile",
          () => HttpResponse.json("", { status: 500 }),
        ),
      );
      // act
      const actual = await userService.syncUser(did);
      // assert
      expect(actual).toEqual({
        did,
        avatar: null,
        description: null,
        displayName: null,
        handle: "example.com",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
    test("DIDを解決できなければ保存せずnullを返す", async () => {
      // arrange
      identityResolver.resolve.mockResolvedValue(null);
      // act
      const actual = await userService.syncUser(did);
      // assert
      expect(actual).toBeNull();
      expect(await userDbRepository.findByDid(did)).toBeNull();
    });
  });
});
