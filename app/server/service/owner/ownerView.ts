import type { Did } from "@atproto/did";

import type { Owner } from "~/models/owner";

export type OwnerView = {
  did: Did;
  handleOrDid: string;
  displayHandle: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export interface IOwnerViewService {
  toOwnerView: (did: Did, owner: Owner | null) => OwnerView;
}

export const ownerViewServiceFactory = (): IOwnerViewService => ({
  toOwnerView(did, owner) {
    const handleOrDid = owner?.handle ?? did;
    return {
      did,
      handleOrDid,
      displayHandle: `@${handleOrDid}`,
      displayName: owner?.displayName ?? null,
      avatarUrl: owner?.avatarCid
        ? `https://cdn.bsky.app/img/avatar/plain/${did}/${owner.avatarCid}@jpeg`
        : null,
    };
  },
});
