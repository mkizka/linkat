import type { Did } from "@atproto/did";

import profile from "~/generated/app/bsky/actor/profile";
import { LinkatAgent } from "~/libs/agent";
import type { Profile } from "~/models/user";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import type { IProfileRecordParser } from "~/server/infrastructure/profileRecordParser";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("accountPdsRepository");

export interface IAccountPdsRepository {
  findByDid: (did: Did) => Promise<{
    handle: string | null;
    profile: Profile | null;
  } | null>;
  fetchSessionProfile: (agent: LinkatAgent) => Promise<Profile | null>;
}

const fetchProfileRecord = async (agent: LinkatAgent, did: Did) => {
  const { value } = await agent.get(profile, { repo: did });
  return value;
};

export const accountPdsRepositoryFactory = ({
  identityResolver,
  profileRecordParser,
}: {
  identityResolver: IIdentityResolver;
  profileRecordParser: IProfileRecordParser;
}): IAccountPdsRepository => {
  const fetchProfile = async (agent: LinkatAgent, did: Did) => {
    const fetched = await tryCatch(fetchProfileRecord)(agent, did);
    if (fetched instanceof Error) {
      logger.warn(fetched, "プロフィールの取得に失敗しました");
      return null;
    }
    return profileRecordParser.parse(fetched);
  };

  return {
    async findByDid(did) {
      const identity = await identityResolver.resolve(did);
      if (!identity) {
        return null;
      }
      logger.info(identity, "プロフィールを取得します");
      return {
        handle: identity.handle,
        profile: await fetchProfile(LinkatAgent.credential(identity.pds), did),
      };
    },
    async fetchSessionProfile(agent) {
      return await fetchProfile(agent, agent.assertDid);
    },
  };
};
