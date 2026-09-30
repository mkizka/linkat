import { type Did, isDid } from "@atproto/did";

import type { User } from "~/models/user";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import type { IUserBskyRepository } from "~/server/infrastructure/userBskyRepository";
import type { IUserDbRepository } from "~/server/infrastructure/userDbRepository";

export interface IUserService {
  findUser: (params: { handleOrDid: string }) => Promise<User | null>;
  syncUser: (did: Did) => Promise<User>;
}

export const userServiceFactory = ({
  identityResolver,
  userDbRepository,
  userBskyRepository,
}: {
  identityResolver: IIdentityResolver;
  userDbRepository: IUserDbRepository;
  userBskyRepository: IUserBskyRepository;
}): IUserService => ({
  async findUser({ handleOrDid }) {
    if (isDid(handleOrDid)) {
      return await userDbRepository.findByDid(handleOrDid);
    }
    if (!handleOrDid.includes(".")) {
      return null;
    }
    const identity = await identityResolver.resolve(handleOrDid);
    if (!identity) {
      return null;
    }
    const user = await userDbRepository.findByDid(identity.did);
    return user?.withHandle(identity.handle) ?? null;
  },
  async syncUser(did) {
    const fetched = await userBskyRepository.findByDid(did);
    return await userDbRepository.save(fetched);
  },
});
