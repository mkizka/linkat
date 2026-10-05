import type { Did } from "@atproto/did";

import { Owner, type OwnerView } from "~/models/owner";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import type { IOwnerRepository } from "~/server/infrastructure/ownerRepository";
import type { IProfileFetcher } from "~/server/infrastructure/profileFetcher";

export interface IEditorService {
  findView: (did: Did) => Promise<OwnerView>;
}

export const editorServiceFactory = ({
  ownerRepository,
  profileFetcher,
  identityResolver,
}: {
  ownerRepository: IOwnerRepository;
  profileFetcher: IProfileFetcher;
  identityResolver: IIdentityResolver;
}): IEditorService => ({
  async findView(did) {
    const owner = await ownerRepository.findByDid(did);
    if (owner) {
      return owner.toView();
    }
    const identity = await identityResolver.resolve(did);
    const profile =
      identity && (await profileFetcher.fetchProfile(identity.pds, did));
    return Owner.create(did).withProfile(profile).toView();
  },
});
