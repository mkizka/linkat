import { asAtIdentifierString } from "@atproto/syntax";

import getProfile from "~/generated/app/bsky/actor/getProfile";
import { LinkatAgent } from "~/libs/agent";
import { User } from "~/models/user";
import { env } from "~/utils/env";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("userBskyRepository");

export interface IUserBskyRepository {
  findByHandleOrDid: (handleOrDid: string) => Promise<User | null>;
}

const fetchProfile = async (handleOrDid: string) => {
  logger.info({ actor: handleOrDid }, "プロフィールを取得します");
  const agent = LinkatAgent.credential(env.BSKY_PUBLIC_API_URL);
  return await agent.call(getProfile, {
    actor: asAtIdentifierString(handleOrDid),
  });
};

export const userBskyRepositoryFactory = (): IUserBskyRepository => ({
  async findByHandleOrDid(handleOrDid) {
    const profile = await tryCatch(fetchProfile)(handleOrDid);
    if (profile instanceof Error) {
      logger.warn(profile, "プロフィールの取得に失敗しました");
      return null;
    }
    return new User({
      did: profile.did,
      avatar: profile.avatar ?? null,
      description: profile.description ?? null,
      displayName: profile.displayName ?? null,
      handle: profile.handle,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  },
});
