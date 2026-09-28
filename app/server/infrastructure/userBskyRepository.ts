import type { Did } from "@atproto/did";

import getProfile from "~/generated/app/bsky/actor/getProfile";
import { LinkatAgent } from "~/libs/agent";
import type { User } from "~/models/user";
import { env } from "~/utils/env";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("userBskyRepository");

export type Profile = Pick<User, "avatar" | "description" | "displayName">;

export interface IUserBskyRepository {
  findProfileByDid: (did: Did) => Promise<Profile | null>;
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
    return {
      avatar: profile.avatar ?? null,
      description: profile.description ?? null,
      displayName: profile.displayName ?? null,
    };
  },
});
