import type { Did } from "@atproto/did";

import type { ProfileViewDetailed } from "~/generated/app/bsky/actor/defs";
import getProfile from "~/generated/app/bsky/actor/getProfile";
import { LinkatAgent } from "~/libs/agent";
import { env } from "~/utils/env";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("userBskyRepository");

export interface IUserBskyRepository {
  findProfileByDid: (did: Did) => Promise<ProfileViewDetailed | null>;
}

const fetchProfile = async (did: Did) => {
  logger.info({ actor: did }, "プロフィールを取得します");
  const agent = LinkatAgent.credential(env.BSKY_PUBLIC_API_URL);
  return await agent.call(getProfile, { actor: did });
};

export const userBskyRepositoryFactory = (): IUserBskyRepository => ({
  async findProfileByDid(did) {
    const profile = await tryCatch(fetchProfile)(did);
    if (profile instanceof Error) {
      logger.warn(profile, "プロフィールの取得に失敗しました");
      return null;
    }
    return profile;
  },
});
