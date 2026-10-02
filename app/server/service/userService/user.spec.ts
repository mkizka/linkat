import { asDid } from "@atproto/did";
import { http, HttpResponse } from "msw";
import { mock, mockReset } from "vitest-mock-extended";

import { LinkatAgent } from "~/libs/agent";
import { server } from "~/mocks/server";
import { UserFactory } from "~/server/factories/user";
import { accountPdsRepositoryFactory } from "~/server/infrastructure/accountPdsRepository";
import { db } from "~/server/infrastructure/drizzle";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import { userDbRepositoryFactory } from "~/server/infrastructure/userDbRepository";
import { userRepositoryFactory } from "~/server/infrastructure/userRepository";

import { userServiceFactory } from "./user";

const identityResolver = mock<IIdentityResolver>();
const userDbRepository = userDbRepositoryFactory({ db });
const accountPdsRepository = accountPdsRepositoryFactory({ identityResolver });
const userService = userServiceFactory({
  userRepository: userRepositoryFactory({
    userDbRepository,
    accountPdsRepository,
  }),
  userDbRepository,
  accountPdsRepository,
  identityResolver,
});

const profile = {
  avatar: null,
  avatarCid: "bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku",
  description: "新しい説明",
  displayName: "新しい名前",
};

const found = (did: string, handle: string | null | undefined) => ({
  type: "found" as const,
  identity: { did: asDid(did), pds: "https://pds.example.com", handle },
});

const AVATAR_CID =
  "bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy";

const getRecordUrl = "https://pds.example.com/xrpc/com.atproto.repo.getRecord";

const createAgent = (did: string) =>
  new LinkatAgent({ did: asDid(did), service: "https://pds.example.com" });

describe("userService", () => {
  describe("findUser", () => {
    test("ユーザーを取得できる", async () => {
      // arrange
      const user = await UserFactory.create();
      // act
      const actual = await userService.findUser({ handleOrDid: user.did });
      // assert
      expect(actual).toEqual(user);
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

  describe("findEditor", () => {
    test("持ち主の写しがあれば、それを返す", async () => {
      // arrange
      const user = await UserFactory.create();
      // act
      const actual = await userService.findEditor(createAgent(user.did));
      // assert
      expect(actual).toEqual(user);
      expect(identityResolver.resolve).not.toHaveBeenCalled();
    });
    test("写しが無ければ、DIDとセッションのPDSから取得したプロフィールを返し、保存しない", async () => {
      // arrange
      const did = "did:plc:editor";
      let requestedRepo: string | null = null;
      server.use(
        http.get(getRecordUrl, ({ request }) => {
          requestedRepo = new URL(request.url).searchParams.get("repo");
          return HttpResponse.json({
            uri: `at://${did}/app.bsky.actor.profile/self`,
            cid: "bafyreidfayvfuwqa7qlnopdjiqrxzs6blmoeu4rujcjtnci5beludirz2a",
            value: {
              $type: "app.bsky.actor.profile",
              displayName: "Alice",
              avatar: {
                $type: "blob",
                ref: { $link: AVATAR_CID },
                mimeType: "image/jpeg",
                size: 1000,
              },
            },
          });
        }),
      );
      // act
      const actual = await userService.findEditor(createAgent(did));
      // assert
      expect(actual).toEqual({
        did,
        handle: null,
        avatar: null,
        avatarCid: AVATAR_CID,
        description: null,
        displayName: "Alice",
      });
      expect(requestedRepo).toBe(did);
      expect(identityResolver.resolve).not.toHaveBeenCalled();
      expect(await userDbRepository.findByDid(asDid(did))).toBeNull();
    });
    test("写しが無くプロフィールの取得にも失敗したら、DIDだけを返す", async () => {
      // arrange
      const did = "did:plc:editor";
      server.use(
        http.get(getRecordUrl, () =>
          HttpResponse.json({ error: "InternalServerError" }, { status: 500 }),
        ),
      );
      // act
      const actual = await userService.findEditor(createAgent(did));
      // assert
      expect(actual).toEqual({
        did,
        handle: null,
        avatar: null,
        avatarCid: null,
        description: null,
        displayName: null,
      });
      expect(await userDbRepository.findByDid(asDid(did))).toBeNull();
    });
  });

  describe("updateProfile", () => {
    beforeEach(() => {
      mockReset(identityResolver);
    });
    test("持ち主の写しがあれば、プロフィールを更新しハンドルを解決し直す", async () => {
      // arrange
      const user = await UserFactory.create({
        handle: "old.example.com",
        displayName: "古い名前",
        description: "古い説明",
        avatar: "https://example.com/avatar.jpg",
      });
      identityResolver.resolve.mockResolvedValue(
        found(user.did, "new.example.com"),
      );
      // act
      const actual = await userService.updateProfile({
        did: asDid(user.did),
        profile,
      });
      // assert
      expect(identityResolver.resolve).toHaveBeenCalledWith(user.did);
      expect(actual).toMatchObject({
        did: user.did,
        handle: "new.example.com",
        ...profile,
      });
      expect(await userDbRepository.findByDid(asDid(user.did))).toEqual(actual);
    });
    test("ハンドルの検証に失敗した場合、写しのハンドルをnullにする", async () => {
      // arrange
      const user = await UserFactory.create({ handle: "old.example.com" });
      identityResolver.resolve.mockResolvedValue(found(user.did, null));
      // act
      const actual = await userService.updateProfile({
        did: asDid(user.did),
        profile,
      });
      // assert
      expect(actual?.handle).toBeNull();
      expect(actual?.displayName).toBe("新しい名前");
    });
    test.each([
      { resolution: { type: "unavailable" as const } },
      { resolution: found("did:plc:dummy", undefined) },
    ])(
      "ハンドルを解決できなかった場合($resolution.type)、既存のハンドルを残してプロフィールは更新する",
      async ({ resolution }) => {
        // arrange
        const user = await UserFactory.create({ handle: "old.example.com" });
        identityResolver.resolve.mockResolvedValue(resolution);
        // act
        const actual = await userService.updateProfile({
          did: asDid(user.did),
          profile,
        });
        // assert
        expect(actual?.handle).toBe("old.example.com");
        expect(actual?.displayName).toBe("新しい名前");
      },
    );
    test("持ち主の写しが無い場合、何もせずnullを返す", async () => {
      // arrange
      const did = asDid("did:plc:notowner0000000000000000");
      // act
      const actual = await userService.updateProfile({ did, profile });
      // assert
      expect(actual).toBeNull();
      expect(identityResolver.resolve).not.toHaveBeenCalled();
      expect(await userDbRepository.findByDid(did)).toBeNull();
    });
  });
});
