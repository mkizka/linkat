import type { Did } from "@atproto/did";

import { type AccountState, Owner, type Profile } from "~/models/owner";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import type { IOwnerRepository } from "~/server/infrastructure/ownerRepository";
import type { IProfileFetcher } from "~/server/infrastructure/profileFetcher";

export interface IOwnerService {
  findOwner: (did: Did) => Promise<Owner>;
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
  async findOwner(did) {
    return (await ownerRepository.findByDid(did)) ?? Owner.create(did);
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
