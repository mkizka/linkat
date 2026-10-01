import type { Did } from "@atproto/did";
import { getBlobCidString } from "@atproto/lex";

import profile from "~/generated/app/bsky/actor/profile";
import { LinkatAgent } from "~/libs/agent";
import type { User } from "~/models/user";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("userPdsRepository");

type Profile = Pick<User, "avatarCid" | "description" | "displayName">;

export interface IUserPdsRepository {
  findByHandleOrDid: (
    handleOrDid: string,
  ) => Promise<{ did: Did; handle: string; profile: Profile | null } | null>;
}

const fetchProfile = async ({ did, pds }: { did: Did; pds: string }) => {
  logger.info({ did, pds }, "プロフィールを取得します");
  const agent = LinkatAgent.credential(pds);
  const { value } = await agent.get(profile, { repo: did });
  return {
    avatarCid: getBlobCidString(value.avatar) ?? null,
    description: value.description ?? null,
    displayName: value.displayName ?? null,
  };
};

export const userPdsRepositoryFactory = ({
  identityResolver,
}: {
  identityResolver: IIdentityResolver;
}): IUserPdsRepository => ({
  async findByHandleOrDid(handleOrDid) {
    const identity = await identityResolver.resolve(handleOrDid);
    if (!identity) {
      return null;
    }
    const fetched = await tryCatch(fetchProfile)(identity);
    if (fetched instanceof Error) {
      logger.warn(fetched, "プロフィールの取得に失敗しました");
    }
    return {
      did: identity.did,
      handle: identity.handle,
      profile: fetched instanceof Error ? null : fetched,
    };
  },
});
