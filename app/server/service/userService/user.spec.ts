import { mock } from "vitest-mock-extended";

import { UserFactory } from "~/server/factories/user";
import { accountPdsRepositoryFactory } from "~/server/infrastructure/accountPdsRepository";
import { db } from "~/server/infrastructure/drizzle";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import { profileRecordParserFactory } from "~/server/infrastructure/profileRecordParser";
import { userDbRepositoryFactory } from "~/server/infrastructure/userDbRepository";
import { userRepositoryFactory } from "~/server/infrastructure/userRepository";

import { userServiceFactory } from "./user";

const userService = userServiceFactory({
  userRepository: userRepositoryFactory({
    userDbRepository: userDbRepositoryFactory({ db }),
    accountPdsRepository: accountPdsRepositoryFactory({
      identityResolver: mock<IIdentityResolver>(),
      profileRecordParser: profileRecordParserFactory(),
    }),
  }),
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
});
