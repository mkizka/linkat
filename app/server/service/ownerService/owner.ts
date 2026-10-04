import { type Did, isDid } from "@atproto/did";

import { LinkatAgent } from "~/libs/agent";
import { type AccountStatus, Owner } from "~/models/owner";
import type { IHandleIndex } from "~/server/infrastructure/handleIndex";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import type { IOwnerRepository } from "~/server/infrastructure/ownerRepository";
import type { IProfileFetcher } from "~/server/infrastructure/profileFetcher";

export interface IOwnerService {
  findOwner: (params: { handleOrDid: string }) => Promise<Owner | null>;
  syncOwner: (did: Did) => Promise<Owner>;
  updateStatus: (did: Did, status: AccountStatus) => Promise<void>;
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
  async findOwner({ handleOrDid }) {
    if (!handleOrDid.includes(".") && !isDid(handleOrDid)) {
      return null;
    }
    const did = isDid(handleOrDid)
      ? handleOrDid
      : await handleIndex.findDid(handleOrDid);
    return did && (await ownerRepository.findByDid(did));
  },
  async syncOwner(did) {
    let owner = (await ownerRepository.findByDid(did)) ?? Owner.create(did);
    const identity = await identityResolver.resolve(did);
    if (!identity) {
      return await ownerRepository.save(owner.withHandle(null));
    }
    const agent = LinkatAgent.credential(identity.pds);
    const profile = await profileFetcher.fetchProfile(agent, did);
    if (profile) {
      owner = owner.withProfile(profile);
    }
    return await ownerRepository.save(owner.withHandle(identity.handle));
  },
  async updateStatus(did, status) {
    await ownerRepository.updateStatus(did, status);
  },
});
