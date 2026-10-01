import type { Did } from "@atproto/did";
import { getBlobCidString } from "@atproto/lex";

import profile from "~/generated/app/bsky/actor/profile";
import { LinkatAgent } from "~/libs/agent";
import { User } from "~/models/user";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("userPdsRepository");

export interface IUserPdsRepository {
  findByHandleOrDid: (handleOrDid: string) => Promise<User | null>;
}

const fetchProfile = async ({ did, pds }: { did: Did; pds: string }) => {
  logger.info({ did, pds }, "プロフィールを取得します");
  const agent = LinkatAgent.credential(pds);
  const { value } = await agent.get(profile, { repo: did });
  return value;
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
    const found = fetched instanceof Error ? null : fetched;
    return new User({
      did: identity.did,
      avatarCid: getBlobCidString(found?.avatar) ?? null,
      description: found?.description ?? null,
      displayName: found?.displayName ?? null,
      handle: identity.handle,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  },
});
