import { isDid } from "@atproto/did";

import type { User } from "~/models/user";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import type { IUserBskyRepository } from "~/server/infrastructure/userBskyRepository";
import type { IUserDbRepository } from "~/server/infrastructure/userDbRepository";

const REFETCH_INTERVAL_MS = 10 * 60 * 1000;

const isFresh = (user: User) =>
  user.updatedAt.getTime() > Date.now() - REFETCH_INTERVAL_MS;

export interface IUserRepository {
  findByHandleOrDid: (handleOrDid: string) => Promise<User | null>;
}

export const userRepositoryFactory = ({
  identityResolver,
  userDbRepository,
  userBskyRepository,
}: {
  identityResolver: IIdentityResolver;
  userDbRepository: IUserDbRepository;
  userBskyRepository: IUserBskyRepository;
}): IUserRepository => ({
  async findByHandleOrDid(handleOrDid) {
    const did = isDid(handleOrDid)
      ? handleOrDid
      : (await identityResolver.resolve(handleOrDid))?.did;
    if (!did) {
      return null;
    }
    const cached = await userDbRepository.findByDid(did);
    if (cached && isFresh(cached)) {
      return cached;
    }
    const fetched = await userBskyRepository.findByDid(did);
    if (!fetched) {
      return cached;
    }
    return (await userDbRepository.saveIfBoardExists(fetched)) ?? fetched;
  },
});
