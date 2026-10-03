import { asDid } from "@atproto/did";
import { mock, mockReset } from "vitest-mock-extended";

import { UserFactory } from "~/server/factories/user";
import { accountPdsRepositoryFactory } from "~/server/infrastructure/accountPdsRepository";
import { db } from "~/server/infrastructure/drizzle";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import { userDbRepositoryFactory } from "~/server/infrastructure/userDbRepository";
import { userRepositoryFactory } from "~/server/infrastructure/userRepository";

import { userServiceFactory } from "./user";

const identityResolver = mock<IIdentityResolver>();
const userDbRepository = userDbRepositoryFactory({ db });

const userService = userServiceFactory({
  userRepository: userRepositoryFactory({
    userDbRepository,
    accountPdsRepository: accountPdsRepositoryFactory({ identityResolver }),
  }),
  userDbRepository,
  identityResolver,
});

const profile = {
  avatar: null,
  avatarCid: "bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku",
  description: "新しい説明",
  displayName: "新しい名前",
};

const identity = (did: string, handle: string | null) => ({
  did: asDid(did),
  pds: "https://pds.example.com",
  handle,
});

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
        identity(user.did, "new.example.com"),
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
    test.each([
      { resolution: identity("did:plc:dummy", null) },
      { resolution: null },
    ])(
      "ハンドルを解決できなかった場合($resolution)、写しのハンドルをnullにしてプロフィールは更新する",
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
        expect(actual?.handle).toBeNull();
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
