import type { Did } from "@atproto/did";
import { getBlobCidString, lexParse } from "@atproto/lex";

import profile, {
  type Main as ProfileRecord,
} from "~/generated/app/bsky/actor/profile";
import { LinkatAgent } from "~/libs/agent";
import type { Owner } from "~/models/owner";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("accountPdsRepository");

export type Profile = Pick<
  Owner,
  "avatar" | "avatarCid" | "description" | "displayName"
>;

export const emptyProfile: Profile = {
  avatar: null,
  avatarCid: null,
  description: null,
  displayName: null,
};

export interface IAccountPdsRepository {
  resolveAccount: (did: Did) => Promise<{
    handle: string | null;
    profile: Profile | null;
  }>;
  fetchSessionProfile: (agent: LinkatAgent) => Promise<Profile | null>;
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

const fetchProfile = async (agent: LinkatAgent, did: Did) => {
  const { value } = await agent.get(profile, { repo: did });
  return toProfile(value);
};

const tryFetchProfile = async (agent: LinkatAgent, did: Did) => {
  const fetched = await tryCatch(fetchProfile)(agent, did);
  if (fetched instanceof Error) {
    logger.warn(fetched, "プロフィールの取得に失敗しました");
    return null;
  }
  return fetched;
};

const fetchProfileFromPds = ({ did, pds }: { did: Did; pds: string }) => {
  logger.info({ did, pds }, "プロフィールを取得します");
  return tryFetchProfile(LinkatAgent.credential(pds), did);
};

export const accountPdsRepositoryFactory = ({
  identityResolver,
}: {
  identityResolver: IIdentityResolver;
}): IAccountPdsRepository => ({
  async resolveAccount(did) {
    const identity = await identityResolver.resolve(did);
    if (!identity) {
      return { handle: null, profile: null };
    }
    return {
      handle: identity.handle,
      profile: await fetchProfileFromPds(identity),
    };
  },
  async fetchSessionProfile(agent) {
    return await tryFetchProfile(agent, agent.assertDid);
  },
});
