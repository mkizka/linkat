import type { Did } from "@atproto/did";
import { getBlobCidString } from "@atproto/lex";

import profile from "~/generated/app/bsky/actor/profile";
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
  resolveAccount: (did: Did) => Promise<{
    handle: string | null;
    profile: Profile | null;
  }>;
  fetchSessionProfile: (agent: LinkatAgent) => Promise<Profile | null>;
}

const fetchProfile = async (agent: LinkatAgent, did: Did) => {
  const { value } = await agent.get(profile, { repo: did });
  return {
    avatar: null,
    avatarCid: getBlobCidString(value.avatar) ?? null,
    description: value.description ?? null,
    displayName: value.displayName ?? null,
  };
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
  async findByHandleOrDid(handleOrDid) {
    const identity = await identityResolver.resolve(handleOrDid);
    if (!identity) {
      return null;
    }
    return {
      did: identity.did,
      handle: identity.handle,
      profile: await fetchProfileFromPds(identity),
    };
  },
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
