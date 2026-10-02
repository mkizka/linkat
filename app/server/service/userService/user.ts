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
  // プロフィールが変わった。持ち主の写しがあれば、レコードの値で更新し、ハンドルを解決し直す
  async updateProfile({ did, profile }) {
    const existing = await userDbRepository.findByDid(did);
    if (!existing) {
      return null;
    }
    const resolution = await identityResolver.resolve(did);
    return await userDbRepository.save({
      did,
      ...profile,
      // 一時的な障害などで解決できなかったときは、既存の値を残す
      handle:
        resolution.type === "found" ? resolution.identity.handle : undefined,
      updatedAt: new Date(),
    });
  },
});
