import type { Did } from "@atproto/did";
import { getBlobCidString, lexParse } from "@atproto/lex";

import profile, {
  type Main as ProfileRecord,
} from "~/generated/app/bsky/actor/profile";
import { LinkatAgent } from "~/libs/agent";
import type { Profile } from "~/models/user";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("accountPdsRepository");

export interface IAccountPdsRepository {
  findByHandleOrDid: (handleOrDid: string) => Promise<{
    did: Did;
    handle: string | null;
    profile: Profile | null;
  } | null>;
}

const toProfile = (value: ProfileRecord): Profile => ({
  avatar: null,
  avatarCid: getBlobCidString(value.avatar) ?? null,
  description: value.description ?? null,
  displayName: value.displayName ?? null,
});

export const parseProfileRecord = (json: unknown): Profile | null => {
  try {
    const result = profile.safeParse(lexParse(JSON.stringify(json)));
    return result.success ? toProfile(result.value) : null;
  } catch {
    return null;
  }
};

const fetchProfile = async ({ did, pds }: { did: Did; pds: string }) => {
  logger.info({ did, pds }, "プロフィールを取得します");
  const agent = LinkatAgent.credential(pds);
  const { value } = await agent.get(profile, { repo: did });
  return toProfile(value);
};

export const accountPdsRepositoryFactory = ({
  identityResolver,
}: {
  identityResolver: IIdentityResolver;
}): IAccountPdsRepository => ({
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
