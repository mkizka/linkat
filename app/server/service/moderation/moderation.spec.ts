import { asDid } from "@atproto/did";

import { db } from "~/server/infrastructure/db/drizzle";
import { moderationRepositoryFactory } from "~/server/infrastructure/moderation/moderationRepository";

import { moderationServiceFactory, NotAdminError } from "./moderation";

const adminDid = asDid("did:plc:admin");
const targetDid = asDid("did:plc:target");
const moderationRepository = moderationRepositoryFactory({ db });
const moderationService = moderationServiceFactory({
  moderationRepository,
  adminDids: [adminDid],
});

describe("moderationService", () => {
  describe("updateLevel", () => {
    test("管理者は非表示レベルを変更できる", async () => {
      // arrange
      await moderationRepository.save(targetDid, "unlisted");
      // act
      await moderationService.updateLevel(adminDid, targetDid, "hidden");
      // assert
      expect(await moderationRepository.findLevel(targetDid)).toBe("hidden");
    });
    test("管理者はnullを渡すと非表示を解除できる", async () => {
      // arrange
      await moderationRepository.save(targetDid, "hidden");
      // act
      await moderationService.updateLevel(adminDid, targetDid, null);
      // assert
      expect(await moderationRepository.findLevel(targetDid)).toBeNull();
    });
    test("管理者以外はNotAdminErrorになり変更されない", async () => {
      // arrange
      await moderationRepository.save(targetDid, "hidden");
      // act
      const actual = moderationService.updateLevel(targetDid, targetDid, null);
      // assert
      await expect(actual).rejects.toThrow(NotAdminError);
      expect(await moderationRepository.findLevel(targetDid)).toBe("hidden");
    });
  });
});
