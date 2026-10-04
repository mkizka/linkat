import { asDid } from "@atproto/did";
import { http, HttpResponse } from "msw";
import { mock, mockReset } from "vitest-mock-extended";

import { server } from "~/mocks/server";
import { UserFactory } from "~/server/factories/user";
import { accountPdsRepositoryFactory } from "~/server/infrastructure/accountPdsRepository";
import { db } from "~/server/infrastructure/drizzle";
import { handleIndexFactory } from "~/server/infrastructure/handleIndex";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import { profileRecordParserFactory } from "~/server/infrastructure/profileRecordParser";
import { userDbRepositoryFactory } from "~/server/infrastructure/userDbRepository";
import { userRepositoryFactory } from "~/server/infrastructure/userRepository";

import { userServiceFactory } from "./user";

const identityResolver = mock<IIdentityResolver>();
const userDbRepository = userDbRepositoryFactory({ db });
const accountPdsRepository = accountPdsRepositoryFactory({
  identityResolver,
  profileRecordParser: profileRecordParserFactory(),
});

const userService = userServiceFactory({
  handleIndex: handleIndexFactory({ db }),
  userRepository: userRepositoryFactory({
    userDbRepository,
    accountPdsRepository,
  }),
  userDbRepository,
  accountPdsRepository,
});

const getRecordUrl = "https://pds.example.com/xrpc/com.atproto.repo.getRecord";

const mockIdentity = (did: string, handle: string | null) =>
  identityResolver.resolve.mockResolvedValue({
    did: asDid(did),
    pds: "https://pds.example.com",
    handle,
  });

beforeEach(() => {
  mockReset(identityResolver);
  identityResolver.resolve.mockResolvedValue(null);
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
    test("handleを指定するとDBの写しからDIDを引いて取得する", async () => {
      // arrange
      const user = await UserFactory.create({ handle: "example.com" });
      // act
      const actual = await userService.findUser({ handleOrDid: "example.com" });
      // assert
      expect(actual).toEqual(user);
    });
    test("写しに無いhandleはハンドルを解決せずにnullを返す", async () => {
      // arrange
      // act
      const actual = await userService.findUser({ handleOrDid: "example.com" });
      // assert
      expect(actual).toBeNull();
      expect(identityResolver.resolve).not.toHaveBeenCalled();
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

  describe("syncOwner", () => {
    test("写しが無ければ、ハンドルを解決しプロフィールを取得して作る", async () => {
      // arrange
      const did = asDid("did:plc:owner");
      mockIdentity(did, "alice.example.com");
      server.use(
        http.get(getRecordUrl, () =>
          HttpResponse.json({
            uri: "at://did:plc:owner/app.bsky.actor.profile/self",
            cid: "bafyreidfayvfuwqa7qlnopdjiqrxzs6blmoeu4rujcjtnci5beludirz2a",
            value: { $type: "app.bsky.actor.profile", displayName: "Alice" },
          }),
        ),
      );
      // act
      const actual = await userService.syncOwner(did);
      // assert
      expect(actual).toMatchObject({
        handle: "alice.example.com",
        displayName: "Alice",
      });
      expect(await userDbRepository.findByDid(did)).toEqual(actual);
    });
    test("DIDを解決できなければ、ハンドルをnullにして既存のプロフィールを残す", async () => {
      // arrange
      const user = await UserFactory.create({
        handle: "alice.example.com",
        displayName: "Alice",
      });
      // act
      const actual = await userService.syncOwner(asDid(user.did));
      // assert
      expect(actual).toMatchObject({ handle: null, displayName: "Alice" });
    });
    test("プロフィールを取得できなければ、既存のプロフィールを残してハンドルは更新する", async () => {
      // arrange
      const user = await UserFactory.create({
        handle: "old.example.com",
        displayName: "Alice",
      });
      mockIdentity(user.did, "alice.example.com");
      server.use(
        http.get(getRecordUrl, () =>
          HttpResponse.json({ error: "InternalServerError" }, { status: 500 }),
        ),
      );
      // act
      const actual = await userService.syncOwner(asDid(user.did));
      // assert
      expect(actual).toMatchObject({
        handle: "alice.example.com",
        displayName: "Alice",
      });
    });
  });
});
