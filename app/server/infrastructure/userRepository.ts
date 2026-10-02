import type { Did } from "@atproto/did";

import { User } from "~/models/user";
import type { IAccountPdsRepository } from "~/server/infrastructure/accountPdsRepository";
import type { IUserDbRepository } from "~/server/infrastructure/userDbRepository";

const REFETCH_INTERVAL_MS = 10 * 60 * 1000;

const isFresh = (user: User) =>
  user.updatedAt.getTime() > Date.now() - REFETCH_INTERVAL_MS;

export interface IUserRepository {
  findByDid: (did: Did) => Promise<User | null>;
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
    const profile =
      fetched.profile ?? (cached?.did === fetched.did ? cached : null);
    return await userDbRepository.save(
      new User({
        did: fetched.did,
        avatar: profile?.avatar ?? null,
        avatarCid: profile?.avatarCid ?? null,
        description: profile?.description ?? null,
        displayName: profile?.displayName ?? null,
        handle: fetched.handle,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  },
});
