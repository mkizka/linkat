import { asDid } from "@atproto/did";

import { db } from "~/server/infrastructure/db/drizzle";
import { moderationRepositoryFactory } from "~/server/infrastructure/moderation/moderationRepository";

import { moderationServiceFactory } from "./moderation";

const adminDid = asDid("did:plc:admin");
const targetDid = asDid("did:plc:target");
const moderationRepository = moderationRepositoryFactory({ db });
const moderationService = moderationServiceFactory({
  moderationRepository,
  adminDids: [adminDid],
});

describe("moderationService", () => {
  describe("updateLevel", () => {
    test("非表示レベルを変更できる", async () => {
      // arrange
      await moderationRepository.save(targetDid, "unlisted");
      // act
      await moderationService.updateLevel(targetDid, "hidden");
      // assert
      expect(await moderationRepository.findLevel(targetDid)).toBe("hidden");
    });
    test("noneを渡すと非表示を解除できる", async () => {
      // arrange
      await moderationRepository.save(targetDid, "hidden");
      // act
      await moderationService.updateLevel(targetDid, "none");
      // assert
      expect(await moderationRepository.findLevel(targetDid)).toBe("none");
    });
  });
});
