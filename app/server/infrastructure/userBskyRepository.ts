import type { Did } from "@atproto/did";
import { z } from "zod";

import { LinkatAgent } from "~/libs/agent";
import { User } from "~/models/user";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("userBskyRepository");

export interface IUserBskyRepository {
  findByHandleOrDid: (handleOrDid: string) => Promise<User | null>;
}

const profileSchema = z.object({
  displayName: z.string().optional(),
  description: z.string().optional(),
  avatar: z.object({ ref: z.custom<{ toString: () => string }>() }).optional(),
});

const fetchProfile = async ({ did, pds }: { did: Did; pds: string }) => {
  logger.info({ did, pds }, "プロフィールを取得します");
  const agent = LinkatAgent.credential(pds);
  const response = await agent.getRecord("app.bsky.actor.profile", "self", {
    repo: did,
  });
  const profile = profileSchema.parse(response.body.value);
  const avatarCid = profile.avatar?.ref.toString();
  return {
    displayName: profile.displayName ?? null,
    description: profile.description ?? null,
    avatar: avatarCid
      ? `${pds}/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${avatarCid}`
      : null,
  };
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
    const profile = await tryCatch(fetchProfile)(identity);
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
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  },
});
