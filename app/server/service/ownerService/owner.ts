import { type Did, isDid } from "@atproto/did";

import { type AccountState, Owner, type Profile } from "~/models/owner";
import type { IHandleIndex } from "~/server/infrastructure/handleIndex";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import type { IOwnerRepository } from "~/server/infrastructure/ownerRepository";
import type { IProfileFetcher } from "~/server/infrastructure/profileFetcher";

export interface IOwnerService {
  findDid: (handleOrDid: string) => Promise<Did | null>;
  findOwner: (did: Did, options?: { fetchProfile?: boolean }) => Promise<Owner>;
  syncOwner: (did: Did) => Promise<Owner>;
  updateProfile: (did: Did, profile: Profile | null) => Promise<Owner | null>;
  refreshHandle: (did: Did) => Promise<Owner | null>;
  updateAccountState: (did: Did, state: AccountState) => Promise<void>;
}

export const ownerServiceFactory = ({
  handleIndex,
  ownerRepository,
  profileFetcher,
  identityResolver,
}: {
  handleIndex: IHandleIndex;
  ownerRepository: IOwnerRepository;
  profileFetcher: IProfileFetcher;
  identityResolver: IIdentityResolver;
}): IOwnerService => ({
  async findDid(handleOrDid) {
    if (isDid(handleOrDid)) {
      return handleOrDid;
    }
    if (!handleOrDid.includes(".")) {
      return null;
    }
    return await handleIndex.findDid(handleOrDid);
  },
  async findOwner(did, options) {
    const owner = await ownerRepository.findByDid(did);
    if (owner) {
      return owner;
    }
    if (!options?.fetchProfile) {
      return Owner.create(did);
    }
    const identity = await identityResolver.resolve(did);
    const profile =
      identity && (await profileFetcher.fetchProfile(identity.pds, did));
    return Owner.create(did).withProfile(profile);
  },
  async syncOwner(did) {
    let owner = (await ownerRepository.findByDid(did)) ?? Owner.create(did);
    const identity = await identityResolver.resolve(did);
    if (!identity) {
      return await ownerRepository.save(owner.withHandle(null));
    }
    const profile = await profileFetcher.fetchProfile(identity.pds, did);
    if (profile) {
      owner = owner.withProfile(profile);
    }
    return await ownerRepository.save(owner.withHandle(identity.handle));
  },
  async updateProfile(did, profile) {
    const owner = await ownerRepository.findByDid(did);
    if (!owner) {
      return null;
    }
    const identity = await identityResolver.resolve(did);
    return await ownerRepository.save(
      owner.withProfile(profile).withHandle(identity?.handle ?? null),
    );
  },
  async refreshHandle(did) {
    const owner = await ownerRepository.findByDid(did);
    if (!owner) {
      return null;
    }
    const identity = await identityResolver.resolve(did, { noCache: true });
    return await ownerRepository.save(
      owner.withHandle(identity?.handle ?? null),
    );
  },
  async updateAccountState(did, state) {
    await ownerRepository.updateAccountState(did, state);
  },
});
