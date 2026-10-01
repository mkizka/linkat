import type { Did } from "@atproto/did";

import type { User } from "~/models/user";
import type { IUserBskyRepository } from "~/server/infrastructure/userBskyRepository";
import type { IUserDbRepository } from "~/server/infrastructure/userDbRepository";

const REFETCH_INTERVAL_MS = 10 * 60 * 1000;

const isFresh = (user: User) =>
  user.updatedAt.getTime() > Date.now() - REFETCH_INTERVAL_MS;

export interface IUserRepository {
  findByDid: (did: Did) => Promise<User | null>;
}

export const userRepositoryFactory = ({
  userDbRepository,
  userBskyRepository,
}: {
  userDbRepository: IUserDbRepository;
  userBskyRepository: IUserBskyRepository;
}): IUserRepository => ({
  async findByDid(did) {
    const cached = await userDbRepository.findByDid(did);
    if (cached && isFresh(cached)) {
      return cached;
    }
    const fetched = await userBskyRepository.findByDid(did);
    if (!fetched) {
      return cached;
    }
    return await userDbRepository.save(fetched);
  },
});
