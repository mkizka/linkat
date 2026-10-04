import { type Did, isDid } from "@atproto/did";

import { LinkatAgent } from "~/libs/agent";
import { type AccountStatus, User } from "~/models/user";
import type { IHandleIndex } from "~/server/infrastructure/handleIndex";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import type { IProfilePdsRepository } from "~/server/infrastructure/profilePdsRepository";
import type { IUserDbRepository } from "~/server/infrastructure/userDbRepository";
import type { IUserRepository } from "~/server/infrastructure/userRepository";

export interface IUserService {
  findUser: (params: { handleOrDid: string }) => Promise<User | null>;
  syncOwner: (did: Did) => Promise<User>;
  updateStatus: (did: Did, status: AccountStatus) => Promise<void>;
}

export const userServiceFactory = ({
  handleIndex,
  userRepository,
  userDbRepository,
  profilePdsRepository,
  identityResolver,
}: {
  handleIndex: IHandleIndex;
  userRepository: IUserRepository;
  userDbRepository: IUserDbRepository;
  profilePdsRepository: IProfilePdsRepository;
  identityResolver: IIdentityResolver;
}): IUserService => ({
  async findUser({ handleOrDid }) {
    if (!handleOrDid.includes(".") && !isDid(handleOrDid)) {
      return null;
    }
    const did = isDid(handleOrDid)
      ? handleOrDid
      : await handleIndex.findDid(handleOrDid);
    return did && (await userRepository.findByDid(did));
  },
  async syncOwner(did) {
    const identity = await identityResolver.resolve(did);
    const profile =
      identity &&
      (await profilePdsRepository.fetchProfile(
        LinkatAgent.credential(identity.pds),
        did,
      ));
    let owner = (await userDbRepository.findByDid(did)) ?? User.create(did);
    if (profile) {
      owner = owner.withProfile(profile);
    }
    return await userDbRepository.save(
      owner.withHandle(identity?.handle ?? null),
    );
  },
  async updateStatus(did, status) {
    await userRepository.updateStatus(did, status);
  },
});
