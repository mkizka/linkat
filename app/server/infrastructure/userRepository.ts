import { asDid, isDid } from "@atproto/did";
import { isValidHandle } from "@atproto/syntax";

import { User } from "~/models/user";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import type { IUserBskyRepository } from "~/server/infrastructure/userBskyRepository";
import type { IUserDbRepository } from "~/server/infrastructure/userDbRepository";

const REFETCH_INTERVAL_MS = 10 * 60 * 1000;

const isFresh = (user: User) =>
  user.updatedAt.getTime() > Date.now() - REFETCH_INTERVAL_MS;

const resolveIdentity = async (
  identityResolver: IIdentityResolver,
  handleOrDid: string,
  cached: User | null,
) => {
  if (cached) {
    const handle = await identityResolver.resolveDidToHandle(cached.did);
    return handle ? { did: cached.did, handle } : null;
  }
  if (isDid(handleOrDid)) {
    const did = asDid(handleOrDid);
    const handle = await identityResolver.resolveDidToHandle(did);
    return handle ? { did, handle } : null;
  }
  if (isValidHandle(handleOrDid)) {
    const did = await identityResolver.resolveHandleToDid(handleOrDid);
    return did ? { did, handle: handleOrDid } : null;
  }
  return null;
};

export interface IUserRepository {
  findByHandleOrDid: (handleOrDid: string) => Promise<User | null>;
}

export const userRepositoryFactory = ({
  userDbRepository,
  userBskyRepository,
  identityResolver,
}: {
  userDbRepository: IUserDbRepository;
  userBskyRepository: IUserBskyRepository;
  identityResolver: IIdentityResolver;
}): IUserRepository => ({
  async findByHandleOrDid(handleOrDid) {
    const cached = await (isDid(handleOrDid)
      ? userDbRepository.findByDid(handleOrDid)
      : userDbRepository.findByHandle(handleOrDid));
    if (cached && isFresh(cached)) {
      return cached;
    }
    const identity = await resolveIdentity(
      identityResolver,
      handleOrDid,
      cached,
    );
    if (!identity) {
      return cached;
    }
    const { did, handle } = identity;
    const profile = await userBskyRepository.findProfileByDid(did);
    const user = cached
      ? cached.refresh({ handle, profile })
      : User.create({ did, handle, profile });
    return await userDbRepository.save(user);
  },
});
