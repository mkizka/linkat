import { isDid } from "@atproto/did";
import { isValidHandle } from "@atproto/syntax";

import { User } from "~/models/user";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import type { IUserBskyRepository } from "~/server/infrastructure/userBskyRepository";
import type { IUserDbRepository } from "~/server/infrastructure/userDbRepository";

const REFETCH_INTERVAL_MS = 10 * 60 * 1000;

const isFresh = (user: User) =>
  user.updatedAt.getTime() > Date.now() - REFETCH_INTERVAL_MS;

const EMPTY_PROFILE = { avatar: null, description: null, displayName: null };

const resolveIdentity = async (
  identityResolver: IIdentityResolver,
  handleOrDid: string,
) => {
  if (isDid(handleOrDid)) {
    const handle = await identityResolver.resolveDidToHandle(handleOrDid);
    return handle ? { did: handleOrDid, handle } : null;
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
      cached?.did ?? handleOrDid,
    );
    if (!identity) {
      return cached;
    }
    const profile = await userBskyRepository.findProfileByDid(identity.did);
    const { avatar, description, displayName } =
      profile ?? cached ?? EMPTY_PROFILE;
    const user = new User({
      ...identity,
      avatar,
      description,
      displayName,
      createdAt: cached?.createdAt ?? new Date(),
      updatedAt: new Date(),
    });
    return await userDbRepository.save(user);
  },
});
