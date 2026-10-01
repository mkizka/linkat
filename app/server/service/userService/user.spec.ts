import { asDid } from "@atproto/did";
import { mock } from "vitest-mock-extended";

import { UserFactory } from "~/server/factories/user";
import { db } from "~/server/infrastructure/drizzle";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import { userBskyRepositoryFactory } from "~/server/infrastructure/userBskyRepository";
import { userDbRepositoryFactory } from "~/server/infrastructure/userDbRepository";
import { userRepositoryFactory } from "~/server/infrastructure/userRepository";

import { userServiceFactory } from "./user";

const identityResolver = mock<IIdentityResolver>();

const userService = userServiceFactory({
  identityResolver,
  userRepository: userRepositoryFactory({
    userDbRepository: userDbRepositoryFactory({ db }),
    userBskyRepository: userBskyRepositoryFactory({ identityResolver }),
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
      expect(actual).toBe("did:plc:dfbe2uvzisfdxwscnwcxdta6");
    });
    test("DBに同じhandleのユーザーがいても、handleはATProtoで解決する", async () => {
      // arrange
      await UserFactory.create({
        did: "did:plc:olduser000000000000000000",
        handle: "example.com",
      });
      identityResolver.resolveHandle.mockResolvedValue(
        asDid("did:plc:dfbe2uvzisfdxwscnwcxdta6"),
      );
      // act
      const actual = await userService.resolveDid("example.com");
      // assert
      expect(actual).toBe("did:plc:dfbe2uvzisfdxwscnwcxdta6");
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
