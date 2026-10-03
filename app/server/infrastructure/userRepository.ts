import { type Did, isDid } from "@atproto/did";

import { User } from "~/models/user";
import type { IAccountPdsRepository } from "~/server/infrastructure/accountPdsRepository";
import type { IUserDbRepository } from "~/server/infrastructure/userDbRepository";

const REFETCH_INTERVAL_MS = 10 * 60 * 1000;

const isFresh = (user: User) =>
  user.updatedAt.getTime() > Date.now() - REFETCH_INTERVAL_MS;

export interface IUserRepository {
  findByHandleOrDid: (handleOrDid: string) => Promise<User | null>;
  refresh: (did: Did) => Promise<User | null>;
}

export const userRepositoryFactory = ({
  userDbRepository,
  accountPdsRepository,
}: {
  userDbRepository: IUserDbRepository;
  accountPdsRepository: IAccountPdsRepository;
}): IUserRepository => {
  const fetchAndSave = async (did: Did, cached: User | null) => {
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
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  };

  return {
    async findByHandleOrDid(handleOrDid) {
      if (isDid(handleOrDid)) {
        const cached = await userDbRepository.findByDid(handleOrDid);
        return cached && isFresh(cached)
          ? cached
          : await fetchAndSave(handleOrDid, cached);
      }
      const cached = await userDbRepository.findByHandle(handleOrDid);
      if (!cached || isFresh(cached)) {
        return cached;
      }
      return await fetchAndSave(cached.did, cached);
    },
    async refresh(did) {
      return await fetchAndSave(did, await userDbRepository.findByDid(did));
    },
  };
};
