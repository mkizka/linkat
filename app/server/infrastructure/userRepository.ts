import type { Did } from "@atproto/did";

import { type AccountStatus, User } from "~/models/user";
import type { IAccountPdsRepository } from "~/server/infrastructure/accountPdsRepository";
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
  accountPdsRepository,
}: {
  userDbRepository: IUserDbRepository;
  accountPdsRepository: IAccountPdsRepository;
}): IUserRepository => ({
  async findByDid(did) {
    const cached = await userDbRepository.findByDid(did);
    if (cached && isFresh(cached)) {
      return cached;
    }
    const fetched = await accountPdsRepository.findByDid(did);
    if (!fetched) {
      return cached;
    }
    const profile = fetched.profile ?? cached;
    return await userDbRepository.save(
      new User({
        did,
        avatar: profile?.avatar ?? null,
        avatarCid: profile?.avatarCid ?? null,
        description: profile?.description ?? null,
        displayName: profile?.displayName ?? null,
        handle: fetched.handle,
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
