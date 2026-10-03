import { asDid } from "@atproto/did";
import { http, HttpResponse } from "msw";
import { mock } from "vitest-mock-extended";

import { server } from "~/mocks/server";
import { UserFactory } from "~/server/factories/user";
import { accountPdsRepositoryFactory } from "~/server/infrastructure/accountPdsRepository";
import { db } from "~/server/infrastructure/drizzle";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import { userDbRepositoryFactory } from "~/server/infrastructure/userDbRepository";

import { userRepositoryFactory } from "./userRepository";

const identityResolver = mock<IIdentityResolver>();

const userRepository = userRepositoryFactory({
  userDbRepository: userDbRepositoryFactory({ db }),
  accountPdsRepository: accountPdsRepositoryFactory({ identityResolver }),
});

const AVATAR_CID =
  "bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy";

const dummyProfileRecord = {
  uri: "at://did:plc:dfbe2uvzisfdxwscnwcxdta6/app.bsky.actor.profile/self",
  cid: "bafyreidfayvfuwqa7qlnopdjiqrxzs6blmoeu4rujcjtnci5beludirz2a",
  value: {
    $type: "app.bsky.actor.profile",
    displayName: "Alice",
    description: "Test user 1",
    avatar: {
      $type: "blob",
      ref: { $link: AVATAR_CID },
      mimeType: "image/jpeg",
      size: 1000,
    },
  },
};

const dummyIdentity = {
  did: asDid("did:plc:dfbe2uvzisfdxwscnwcxdta6"),
  handle: "example.com",
  pds: "https://pds.example.com",
};

const getRecordUrl = "https://pds.example.com/xrpc/com.atproto.repo.getRecord";

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
      const user = await UserFactory.create({ handle: "example.com" });
      // act
      const actual = await userRepository.findByHandleOrDid("example.com");
      // assert
      expect(actual).toEqual(user);
    });
    test("DBにユーザーがいないとき、PDSから取得して作成できる", async () => {
      // arrange
      identityResolver.resolve.mockResolvedValue(dummyIdentity);
      server.use(
        http.get(getRecordUrl, () => HttpResponse.json(dummyProfileRecord)),
      );
      // act
      const actual = await userRepository.findByHandleOrDid("example.com");
      // assert
      expect(actual).toEqual({
        avatar: null,
        avatarCid: AVATAR_CID,
        description: "Test user 1",
        did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
        displayName: "Alice",
        handle: "example.com",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
    test("DBにユーザーがいて最終更新から一定時間経過している場合、PDSから取得して作成する", async () => {
      // arrange
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-01T00:10:00.000Z"));
      await UserFactory.create({
        did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
        avatar: "https://example.com/avatar.png",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      });
      identityResolver.resolve.mockResolvedValue(dummyIdentity);
      server.use(
        http.get(getRecordUrl, () => HttpResponse.json(dummyProfileRecord)),
      );
      // act
      const actual = await userRepository.findByHandleOrDid(
        "did:plc:dfbe2uvzisfdxwscnwcxdta6",
      );
      // assert
      expect(actual).toEqual({
        avatar: null,
        avatarCid: AVATAR_CID,
        description: "Test user 1",
        did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
        displayName: "Alice",
        handle: "example.com",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:10:00.000Z"),
      });
    });
    test("DBにユーザーがいないとき、プロフィールが取得できなくてもDIDとhandleだけで作成できる", async () => {
      // arrange
      identityResolver.resolve.mockResolvedValue(dummyIdentity);
      server.use(
        http.get(getRecordUrl, () => HttpResponse.json("", { status: 500 })),
      );
      // act
      const actual = await userRepository.findByHandleOrDid("example.com");
      // assert
      expect(actual).toEqual({
        avatar: null,
        avatarCid: null,
        description: null,
        did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
        displayName: null,
        handle: "example.com",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
    test("DBに写しがあって最終更新から一定時間経過しているが、プロフィールが取得できなかった場合、既存のプロフィールを残す", async () => {
      // arrange
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-01T00:10:00.000Z"));
      await UserFactory.create({
        did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
        handle: "old.example.com",
        avatar: "https://example.com/avatar.png",
        description: "Test user 1",
        displayName: "Alice",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      });
      identityResolver.resolve.mockResolvedValue(dummyIdentity);
      server.use(
        http.get(getRecordUrl, () => HttpResponse.json("", { status: 500 })),
      );
      // act
      const actual = await userRepository.findByHandleOrDid(
        "did:plc:dfbe2uvzisfdxwscnwcxdta6",
      );
      // assert
      expect(actual).toEqual({
        avatar: "https://example.com/avatar.png",
        avatarCid: null,
        description: "Test user 1",
        did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
        displayName: "Alice",
        handle: "example.com",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:10:00.000Z"),
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
    test("DBにユーザーがなく、DIDを解決できないときnullを返す", async () => {
      // arrange
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
