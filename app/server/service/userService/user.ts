import { type Did, isDid } from "@atproto/did";

import type { User } from "~/models/user";
import type { Profile } from "~/server/infrastructure/accountPdsRepository";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import type { IUserDbRepository } from "~/server/infrastructure/userDbRepository";
import type { IUserRepository } from "~/server/infrastructure/userRepository";

export interface IUserService {
  findUser: (params: { handleOrDid: string }) => Promise<User | null>;
  updateProfile: (params: {
    did: Did;
    profile: Profile;
  }) => Promise<User | null>;
}

export const userServiceFactory = ({
  userRepository,
  userDbRepository,
  identityResolver,
}: {
  userRepository: IUserRepository;
  userDbRepository: IUserDbRepository;
  identityResolver: IIdentityResolver;
}): IUserService => ({
  async findUser({ handleOrDid }) {
    if (!handleOrDid.includes(".") && !isDid(handleOrDid)) {
      return null;
    }
    return await userRepository.findByHandleOrDid(handleOrDid);
  },
  async updateProfile({ did, profile }) {
    const existing = await userDbRepository.findByDid(did);
    if (!existing) {
      return null;
    }
    const resolution = await identityResolver.resolve(did);
    return await userDbRepository.save({
      did,
      ...profile,
      handle:
        resolution.type === "found" ? resolution.identity.handle : undefined,
      updatedAt: new Date(),
    });
  },
});
