import type { Did } from "@atproto/did";

import type { ModerationLevelDto } from "~/server/infrastructure/moderation/moderationDto";
import type { IModerationRepository } from "~/server/infrastructure/moderation/moderationRepository";

export class NotAdminError extends Error {}

export interface IModerationService {
  isAdmin: (did: Did | null) => boolean;
  updateLevel: (
    editorDid: Did | null,
    ownerDid: Did,
    level: ModerationLevelDto | null,
  ) => Promise<void>;
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
    async updateLevel(editorDid, ownerDid, level) {
      if (!isAdmin(editorDid)) {
        throw new NotAdminError("管理者ではありません");
      }
      await moderationRepository.save(ownerDid, level);
    },
  };
};
