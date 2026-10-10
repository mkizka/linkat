import type { Did } from "@atproto/did";

import {
  type AccountState,
  Owner,
  type OwnerView,
  type Profile,
} from "~/models/owner";
import type { IIdentityResolver } from "~/server/infrastructure/owner/identityResolver";
import type { IOwnerRepository } from "~/server/infrastructure/owner/ownerRepository";
import type { IProfileFetcher } from "~/server/infrastructure/owner/profileFetcher";

export interface IOwnerService {
  findOwnerView: (did: Did) => Promise<OwnerView>;
  syncOwner: (did: Did) => Promise<Owner>;
  updateProfile: (did: Did, profile: Profile | null) => Promise<Owner | null>;
  refreshHandle: (did: Did) => Promise<Owner | null>;
  updateAccountState: (did: Did, state: AccountState) => Promise<void>;
}

export const ownerServiceFactory = ({
  ownerRepository,
  profileFetcher,
  identityResolver,
}: {
  ownerRepository: IOwnerRepository;
  profileFetcher: IProfileFetcher;
  identityResolver: IIdentityResolver;
}): IOwnerService => ({
  async findOwnerView(did) {
    const owner = await ownerRepository.findByDid(did);
    if (!owner) {
      return Owner.viewFromDid(did);
    }
    return owner.toView();
  },
  async syncOwner(did) {
    const identity = await identityResolver.resolve(did);
    const profile =
      identity && (await profileFetcher.fetchProfile(identity.pds, did));
    return await ownerRepository.upsert(did, {
      handle: identity?.handle ?? null,
      profile,
    });
  },
  async updateProfile(did, profile) {
    if (!(await ownerRepository.findByDid(did))) {
      return null;
    }
    const identity = await identityResolver.resolve(did);
    return await ownerRepository.updateProfile(did, {
      handle: identity?.handle ?? null,
      profile,
    });
  },
  async refreshHandle(did) {
    if (!(await ownerRepository.findByDid(did))) {
      return null;
    }
    const identity = await identityResolver.resolve(did, { noCache: true });
    return await ownerRepository.updateHandle(did, identity?.handle ?? null);
  },
  async updateAccountState(did, state) {
    await ownerRepository.updateAccountState(did, state);
  },
});
