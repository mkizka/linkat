import type { Did } from "@atproto/did";

import { LinkatAgent } from "~/libs/agent";
import { type AccountState, User } from "~/models/user";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import type { IProfileFetcher } from "~/server/infrastructure/profileFetcher";
import type { IUserDbRepository } from "~/server/infrastructure/userDbRepository";

const REFETCH_INTERVAL_MS = 10 * 60 * 1000;

const isFresh = (user: User) =>
  user.updatedAt.getTime() > Date.now() - REFETCH_INTERVAL_MS;

export interface IUserRepository {
  findByDid: (did: Did) => Promise<User | null>;
  updateAccountState: (did: Did, state: AccountState) => Promise<void>;
}

export const userRepositoryFactory = ({
  userDbRepository,
  profileFetcher,
  identityResolver,
}: {
  userDbRepository: IUserDbRepository;
  profileFetcher: IProfileFetcher;
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
    const fetched = await profileFetcher.fetchProfile(agent, did);
    const profile = fetched ?? cached;
    return await userDbRepository.save(
      new User({
        did,
        avatar: profile?.avatar ?? null,
        avatarCid: profile?.avatarCid ?? null,
        description: profile?.description ?? null,
        displayName: profile?.displayName ?? null,
        handle: identity.handle,
        active: true,
        status: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  },
  async updateAccountState(did, state) {
    await userDbRepository.updateAccountState(did, state);
  },
});
