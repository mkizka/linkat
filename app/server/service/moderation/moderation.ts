import type { Did } from "@atproto/did";

export interface IModerationService {
  isAdmin: (did: Did | null) => boolean;
}

export const moderationServiceFactory = ({
  adminDids,
}: {
  adminDids: Did[];
}): IModerationService => ({
  isAdmin: (did) => !!did && adminDids.includes(did),
});
