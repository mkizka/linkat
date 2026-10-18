import type { Did } from "@atproto/did";

import type { OwnerDto } from "~/server/infrastructure/owner/ownerDto";

export type OwnerView = {
  did: Did;
  handleOrDid: string;
  displayHandle: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export interface IOwnerViewService {
  toOwnerView: (did: Did, owner: OwnerDto | null) => OwnerView;
}

export const ownerViewServiceFactory = (): IOwnerViewService => ({
  toOwnerView(did, owner) {
    const handleOrDid = owner?.handle ?? did;
    return {
      did,
      handleOrDid,
      displayHandle: owner?.handle ? `@${owner.handle}` : null,
      displayName: owner?.displayName ?? null,
      avatarUrl: owner?.avatarCid
        ? `https://cdn.bsky.app/img/avatar/plain/${did}/${owner.avatarCid}@jpeg`
        : null,
    };
  },
});
