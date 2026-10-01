import { isDid } from "@atproto/did";

import { User } from "~/models/user";
import type { IUserDbRepository } from "~/server/infrastructure/userDbRepository";
import type { IUserPdsRepository } from "~/server/infrastructure/userPdsRepository";

const REFETCH_INTERVAL_MS = 10 * 60 * 1000;

const isFresh = (user: User) =>
  user.updatedAt.getTime() > Date.now() - REFETCH_INTERVAL_MS;

export interface IUserRepository {
  findByHandleOrDid: (handleOrDid: string) => Promise<User | null>;
}

export const userRepositoryFactory = ({
  userDbRepository,
  userPdsRepository,
}: {
  userDbRepository: IUserDbRepository;
  userPdsRepository: IUserPdsRepository;
}): IUserRepository => ({
  async findByHandleOrDid(handleOrDid) {
    const cached = await (isDid(handleOrDid)
      ? userDbRepository.findByDid(handleOrDid)
      : userDbRepository.findByHandle(handleOrDid));
    if (cached && isFresh(cached)) {
      return cached;
    }
    const fetched = await userPdsRepository.findByHandleOrDid(handleOrDid);
    if (!fetched) {
      return cached;
    }
    const profile =
      fetched.profile ?? (cached?.did === fetched.did ? cached : null);
    return await userDbRepository.save(
      new User({
        did: fetched.did,
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
