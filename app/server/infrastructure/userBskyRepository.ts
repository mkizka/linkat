import type { Did } from "@atproto/did";

import getProfile from "~/generated/app/bsky/actor/getProfile";
import { LinkatAgent } from "~/libs/agent";
import { User } from "~/models/user";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import { env } from "~/utils/env";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("userBskyRepository");

export interface IUserBskyRepository {
  findByHandleOrDid: (handleOrDid: string) => Promise<User | null>;
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
  async findByHandleOrDid(handleOrDid) {
    const identity = await identityResolver.resolve(handleOrDid);
    if (!identity) {
      return null;
    }
    const profile = await tryCatch(fetchProfile)(identity.did);
    if (profile instanceof Error) {
      logger.warn(profile, "プロフィールの取得に失敗しました");
    }
    const found = profile instanceof Error ? null : profile;
    return new User({
      did: identity.did,
      avatar: found?.avatar ?? null,
      description: found?.description ?? null,
      displayName: found?.displayName ?? null,
      handle: identity.handle,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  },
});
