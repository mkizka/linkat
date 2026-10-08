import type { Did } from "@atproto/did";
import { Client } from "@atproto/lex";

import profile from "~/generated/app/bsky/actor/profile";
import type { Profile } from "~/models/owner";
import { createLogger } from "~/server/infrastructure/logger";
import type { IProfileRecordParser } from "~/server/infrastructure/profileRecordParser";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("profileFetcher");

export interface IProfileFetcher {
  fetchProfile: (pds: string, did: Did) => Promise<Profile | null>;
}

const fetchProfileRecord = async (pds: string, did: Did) => {
  const { value } = await new Client(pds).get(profile, { repo: did });
  return value;
};

export const profileFetcherFactory = ({
  profileRecordParser,
}: {
  profileRecordParser: IProfileRecordParser;
}): IProfileFetcher => ({
  async fetchProfile(pds, did) {
    logger.info("プロフィールを取得します", { did });
    const fetched = await tryCatch(fetchProfileRecord)(pds, did);
    if (fetched instanceof Error) {
      logger.warn("プロフィールの取得に失敗しました", { error: fetched });
      return null;
    }
    return profileRecordParser.parse(fetched);
  },
});
