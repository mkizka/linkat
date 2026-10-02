import type { Did } from "@atproto/did";
import { getBlobCidString } from "@atproto/lex";

import profile from "~/generated/app/bsky/actor/profile";
import { LinkatAgent } from "~/libs/agent";
import type { User } from "~/models/user";
import type {
  Identity,
  IIdentityResolver,
} from "~/server/infrastructure/identityResolver";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("accountPdsRepository");

type Profile = Pick<
  User,
  "avatar" | "avatarCid" | "description" | "displayName"
>;

export interface IAccountPdsRepository {
  findByHandleOrDid: (handleOrDid: string) => Promise<{
    did: Did;
    handle: Identity["handle"];
    profile: Profile | null;
  } | null>;
}

const fetchProfile = async ({ did, pds }: { did: Did; pds: string }) => {
  logger.info({ did, pds }, "プロフィールを取得します");
  const agent = LinkatAgent.credential(pds);
  const { value } = await agent.get(profile, { repo: did });
  return {
    avatar: null,
    avatarCid: getBlobCidString(value.avatar) ?? null,
    description: value.description ?? null,
    displayName: value.displayName ?? null,
  };
};

export const accountPdsRepositoryFactory = ({
  identityResolver,
}: {
  identityResolver: IIdentityResolver;
}): IAccountPdsRepository => ({
  async findByHandleOrDid(handleOrDid) {
    const resolution = await identityResolver.resolve(handleOrDid);
    if (resolution.type !== "found") {
      return null;
    }
    const { identity } = resolution;
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
