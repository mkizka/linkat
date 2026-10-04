import type { Did } from "@atproto/did";

import profile from "~/generated/app/bsky/actor/profile";
import type { LinkatAgent } from "~/libs/agent";
import type { Profile } from "~/models/user";
import type { IProfileRecordParser } from "~/server/infrastructure/profileRecordParser";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("profileFetcher");

export interface IProfileFetcher {
  fetchProfile: (agent: LinkatAgent, did: Did) => Promise<Profile | null>;
}

const fetchProfileRecord = async (agent: LinkatAgent, did: Did) => {
  const { value } = await agent.get(profile, { repo: did });
  return value;
};

export const profileFetcherFactory = ({
  profileRecordParser,
}: {
  profileRecordParser: IProfileRecordParser;
}): IProfileFetcher => ({
  async fetchProfile(agent, did) {
    logger.info({ did }, "プロフィールを取得します");
    const fetched = await tryCatch(fetchProfileRecord)(agent, did);
    if (fetched instanceof Error) {
      logger.warn(fetched, "プロフィールの取得に失敗しました");
      return null;
    }
    return profileRecordParser.parse(fetched);
  },
});
