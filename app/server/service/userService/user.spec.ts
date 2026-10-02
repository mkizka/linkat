import { asDid } from "@atproto/did";
import { mock } from "vitest-mock-extended";

import { UserFactory } from "~/server/factories/user";
import { accountPdsRepositoryFactory } from "~/server/infrastructure/accountPdsRepository";
import { db } from "~/server/infrastructure/drizzle";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import { userDbRepositoryFactory } from "~/server/infrastructure/userDbRepository";
import { userRepositoryFactory } from "~/server/infrastructure/userRepository";

import { userServiceFactory } from "./user";

const identityResolver = mock<IIdentityResolver>();

const userService = userServiceFactory({
  identityResolver,
  userRepository: userRepositoryFactory({
    userDbRepository: userDbRepositoryFactory({ db }),
    accountPdsRepository: accountPdsRepositoryFactory({ identityResolver }),
  }),
});

describe("userService", () => {
  describe("resolveDid", () => {
    test("DIDはそのまま返す", async () => {
      // arrange
      // act
      const actual = await userService.resolveDid(
        "did:plc:dfbe2uvzisfdxwscnwcxdta6",
      );
      // assert
      expect(actual).toEqual({
        status: "resolved",
        did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
      });
    });
    test("DBに同じhandleのユーザーがいても、handleはATProtoで解決する", async () => {
      // arrange
      await UserFactory.create({
        did: "did:plc:olduser000000000000000000",
        handle: "example.com",
      });
      identityResolver.resolveHandle.mockResolvedValue({
        status: "resolved",
        did: asDid("did:plc:dfbe2uvzisfdxwscnwcxdta6"),
      });
      // act
      const actual = await userService.resolveDid("example.com");
      // assert
      expect(actual).toEqual({
        status: "resolved",
        did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
      });
      expect(identityResolver.resolveHandle).toHaveBeenCalledWith(
        "example.com",
      );
    });
  });
  describe("findUser", () => {
    test("ユーザーを取得できる", async () => {
      // arrange
      const user = await UserFactory.create();
      // act
      const actual = await userService.findUser({ did: asDid(user.did) });
      // assert
      expect(actual).toEqual(user);
    });
  });
});
