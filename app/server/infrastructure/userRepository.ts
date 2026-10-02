import { asDid, isDid } from "@atproto/did";

import type { User } from "~/models/user";
import type { IAccountPdsRepository } from "~/server/infrastructure/accountPdsRepository";
import type { IUserDbRepository } from "~/server/infrastructure/userDbRepository";

const REFETCH_INTERVAL_MS = 10 * 60 * 1000;

const isFresh = (user: User) =>
  user.updatedAt.getTime() > Date.now() - REFETCH_INTERVAL_MS;

export interface IUserRepository {
  findByHandleOrDid: (handleOrDid: string) => Promise<User | null>;
}

export const userRepositoryFactory = ({
  userDbRepository,
  accountPdsRepository,
}: {
  userDbRepository: IUserDbRepository;
  accountPdsRepository: IAccountPdsRepository;
}): IUserRepository => ({
  async findByHandleOrDid(handleOrDid) {
    // ハンドルとDIDの対応は写しから引き、閲覧時にハンドルを解決しない
    // 写しに無いハンドルはnullを返す
    const cached = await (isDid(handleOrDid)
      ? userDbRepository.findByDid(handleOrDid)
      : userDbRepository.findByHandle(handleOrDid));
    if (!cached && !isDid(handleOrDid)) {
      return null;
    }
    if (cached && isFresh(cached)) {
      return cached;
    }
    const did = cached?.did ?? asDid(handleOrDid);
    const fetched = await accountPdsRepository.findByDid(did);
    if (!fetched) {
      return cached;
    }
    const profile =
      fetched.profile ?? (cached?.did === fetched.did ? cached : null);
    return await userDbRepository.save({
      did: fetched.did,
      avatar: profile?.avatar ?? null,
      avatarCid: profile?.avatarCid ?? null,
      description: profile?.description ?? null,
      displayName: profile?.displayName ?? null,
      handle: fetched.handle,
      updatedAt: new Date(),
    });
  },
});
