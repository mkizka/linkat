import type { Did } from "@atproto/did";

import type { ModerationLevelDto } from "~/server/infrastructure/moderation/moderationDto";
import type { IModerationRepository } from "~/server/infrastructure/moderation/moderationRepository";

export interface IModerationService {
  isAdmin: (did: Did | null) => boolean;
  updateLevel: (ownerDid: Did, level: ModerationLevelDto) => Promise<void>;
}

export const moderationServiceFactory = ({
  moderationRepository,
  adminDids,
}: {
  moderationRepository: IModerationRepository;
  adminDids: Did[];
}): IModerationService => {
  const isAdmin = (did: Did | null) => !!did && adminDids.includes(did);
  return {
    isAdmin,
    updateLevel: (ownerDid, level) =>
      moderationRepository.save(ownerDid, level),
  };
};
