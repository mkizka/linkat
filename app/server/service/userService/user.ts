import { type Did, isDid } from "@atproto/did";

import { LinkatAgent } from "~/libs/agent";
import { type AccountStatus, User, type UserView } from "~/models/user";
import type { IHandleIndex } from "~/server/infrastructure/handleIndex";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import type { IProfileFetcher } from "~/server/infrastructure/profileFetcher";
import type { IUserDbRepository } from "~/server/infrastructure/userDbRepository";
import type { IUserRepository } from "~/server/infrastructure/userRepository";

export interface IUserService {
  findUser: (params: { handleOrDid: string }) => Promise<User | null>;
  findEditor: (agent: LinkatAgent) => Promise<UserView>;
  syncOwner: (did: Did) => Promise<User>;
  updateStatus: (did: Did, status: AccountStatus) => Promise<void>;
}

export const userServiceFactory = ({
  handleIndex,
  userRepository,
  userDbRepository,
  profileFetcher,
  identityResolver,
}: {
  handleIndex: IHandleIndex;
  userRepository: IUserRepository;
  userDbRepository: IUserDbRepository;
  profileFetcher: IProfileFetcher;
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
  async findEditor(agent) {
    const did = agent.assertDid;
    const owner = await userDbRepository.findByDid(did);
    if (owner) {
      return owner.toView();
    }
    const profile = await profilePdsRepository.fetchProfile(agent, did);
    return User.create(did).withProfile(profile).toView();
  },
  async syncOwner(did) {
    let owner = (await userDbRepository.findByDid(did)) ?? User.create(did);
    const identity = await identityResolver.resolve(did);
    if (!identity) {
      return await userDbRepository.save(owner.withHandle(null));
    }
    const agent = LinkatAgent.credential(identity.pds);
    const profile = await profileFetcher.fetchProfile(agent, did);
    if (profile) {
      owner = owner.withProfile(profile);
    }
    return await userDbRepository.save(owner.withHandle(identity.handle));
  },
  async updateStatus(did, status) {
    await userRepository.updateStatus(did, status);
  },
});
