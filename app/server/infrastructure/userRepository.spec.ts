import { http, HttpResponse } from "msw";
import { mock } from "vitest-mock-extended";

import { server } from "~/mocks/server";
import { UserFactory } from "~/server/factories/user";
import { db } from "~/server/infrastructure/drizzle";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import { userBskyRepositoryFactory } from "~/server/infrastructure/userBskyRepository";
import { userDbRepositoryFactory } from "~/server/infrastructure/userDbRepository";

import { userRepositoryFactory } from "./userRepository";

const identityResolver = mock<IIdentityResolver>();

const userRepository = userRepositoryFactory({
  userDbRepository: userDbRepositoryFactory({ db }),
  userBskyRepository: userBskyRepositoryFactory({ identityResolver }),
});

const pds = "https://pds.example.com";

const dummyProfileRecord = {
  uri: "at://did:plc:dfbe2uvzisfdxwscnwcxdta6/app.bsky.actor.profile/self",
  cid: "bafyreigrtosreva7e5m7bwbbfsmw77gkdnieizgxwpobw5iobuck3j54xa",
  value: {
    $type: "app.bsky.actor.profile",
    displayName: "Alice",
    description: "Test user 1",
    avatar: {
      $type: "blob",
      ref: { $link: "bafkreiavatar" },
      mimeType: "image/png",
      size: 1000,
    },
  },
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
      identityResolver.resolve.mockResolvedValue({
        did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
        handle: "example.com",
        pds,
      });
      server.use(
        http.get(`${pds}/xrpc/com.atproto.repo.getRecord`, () =>
          HttpResponse.json(dummyProfileRecord),
        ),
      );
      // act
      const actual = await userRepository.findByHandleOrDid("example.com");
      // assert
      expect(actual).toEqual({
        avatar: `${pds}/xrpc/com.atproto.sync.getBlob?did=did:plc:dfbe2uvzisfdxwscnwcxdta6&cid=bafkreiavatar`,
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
      identityResolver.resolve.mockResolvedValue({
        did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
        handle: "example.com",
        pds,
      });
      server.use(
        http.get(`${pds}/xrpc/com.atproto.repo.getRecord`, () =>
          HttpResponse.json(dummyProfileRecord),
        ),
      );
      // act
      const actual = await userRepository.findByHandleOrDid(
        "did:plc:dfbe2uvzisfdxwscnwcxdta6",
      );
      // assert
      expect(actual).toEqual({
        avatar: `${pds}/xrpc/com.atproto.sync.getBlob?did=did:plc:dfbe2uvzisfdxwscnwcxdta6&cid=bafkreiavatar`,
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
      identityResolver.resolve.mockResolvedValue({
        did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
        handle: "example.com",
        pds,
      });
      server.use(
        http.get(`${pds}/xrpc/com.atproto.repo.getRecord`, () =>
          HttpResponse.json("", { status: 500 }),
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
