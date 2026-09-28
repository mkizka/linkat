import { isDid } from "@atproto/did";

import type { User } from "~/models/user";
import type { IUserBskyRepository } from "~/server/infrastructure/userBskyRepository";
import type { IUserDbRepository } from "~/server/infrastructure/userDbRepository";

const REFETCH_INTERVAL_MS = 10 * 60 * 1000;

const isFresh = (user: User) =>
  user.updatedAt.getTime() > Date.now() - REFETCH_INTERVAL_MS;

export interface IUserRepository {
  findByHandleOrDid: (handleOrDid: string) => Promise<User | null>;
}

export const userRepositoryFactory = ({
  userDbRepository,
  userBskyRepository,
}: {
  userDbRepository: IUserDbRepository;
  userBskyRepository: IUserBskyRepository;
}): IUserRepository => ({
  async findByHandleOrDid(handleOrDid) {
    const cached = await (isDid(handleOrDid)
      ? userDbRepository.findByDid(handleOrDid)
      : userDbRepository.findByHandle(handleOrDid));
    if (cached && isFresh(cached)) {
      return cached;
    }
    const fetched = await userBskyRepository.findByHandleOrDid(handleOrDid);
    if (!fetched) {
      return cached;
    }
    return await userDbRepository.save(fetched);
  },
});
