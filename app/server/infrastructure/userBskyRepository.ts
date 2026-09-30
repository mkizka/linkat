import type { Did } from "@atproto/did";

import getProfile from "~/generated/app/bsky/actor/getProfile";
import { LinkatAgent } from "~/libs/agent";
import { INVALID_HANDLE, User } from "~/models/user";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import { env } from "~/utils/env";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("userBskyRepository");

export interface IUserBskyRepository {
  findByDid: (did: Did) => Promise<User>;
}

const fetchProfile = async (did: Did) => {
  logger.info({ actor: did }, "プロフィールを取得します");
  const agent = LinkatAgent.credential(env.BSKY_PUBLIC_API_URL);
  return await agent.call(getProfile, { actor: did });
};

export const userBskyRepositoryFactory = ({
  identityResolver,
}: {
  identityResolver: IIdentityResolver;
}): IUserBskyRepository => ({
  async findByDid(did) {
    const identity = await identityResolver.resolve(did);
    const profile = await tryCatch(fetchProfile)(did);
    if (profile instanceof Error) {
      logger.warn(profile, "プロフィールの取得に失敗しました");
    }
    const found = profile instanceof Error ? null : profile;
    return new User({
      did,
      avatar: found?.avatar ?? null,
      description: found?.description ?? null,
      displayName: found?.displayName ?? null,
      handle: identity?.handle ?? INVALID_HANDLE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  },
});
