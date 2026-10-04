import type { Did } from "@atproto/did";

import { LinkatAgent } from "~/libs/agent";
import { type AccountStatus, User } from "~/models/user";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import type { IProfilePdsRepository } from "~/server/infrastructure/profilePdsRepository";
import type { IUserDbRepository } from "~/server/infrastructure/userDbRepository";

const REFETCH_INTERVAL_MS = 10 * 60 * 1000;

const isFresh = (user: User) =>
  user.updatedAt.getTime() > Date.now() - REFETCH_INTERVAL_MS;

export interface IUserRepository {
  findByDid: (did: Did) => Promise<User | null>;
  updateStatus: (did: Did, status: AccountStatus) => Promise<void>;
}

export const userRepositoryFactory = ({
  userDbRepository,
  profilePdsRepository,
  identityResolver,
}: {
  userDbRepository: IUserDbRepository;
  profilePdsRepository: IProfilePdsRepository;
  identityResolver: IIdentityResolver;
}): IUserRepository => ({
  async findByDid(did) {
    const cached = await userDbRepository.findByDid(did);
    if (cached && isFresh(cached)) {
      return cached;
    }
    const identity = await identityResolver.resolve(did);
    if (!identity) {
      return cached;
    }
    const agent = LinkatAgent.credential(identity.pds);
    const fetched = await profilePdsRepository.fetchProfile(agent, did);
    const profile = fetched ?? cached;
    return await userDbRepository.save(
      new User({
        did,
        avatar: profile?.avatar ?? null,
        avatarCid: profile?.avatarCid ?? null,
        description: profile?.description ?? null,
        displayName: profile?.displayName ?? null,
        handle: identity.handle,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  },
  async updateStatus(did, status) {
    await userDbRepository.updateStatus(did, status);
  },
});
