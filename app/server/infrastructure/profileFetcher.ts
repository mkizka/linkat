import type { Did } from "@atproto/did";
import { Client } from "@atproto/lex";

import type { Profile } from "~/models/owner";
import type { IProfileRecordParser } from "~/server/infrastructure/profileRecordParser";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("profileFetcher");

export interface IProfileFetcher {
  fetchProfile: (pds: string, did: Did) => Promise<Profile | null>;
}

const fetchProfileRecord = async (pds: string, did: Did) => {
  const response = await new Client(pds).getRecord(
    "app.bsky.actor.profile",
    "self",
    { repo: did },
  );
  return response.body.value;
};

export const profileFetcherFactory = ({
  profileRecordParser,
}: {
  profileRecordParser: IProfileRecordParser;
}): IProfileFetcher => ({
  async fetchProfile(pds, did) {
    logger.info({ did }, "プロフィールを取得します");
    const fetched = await tryCatch(fetchProfileRecord)(pds, did);
    if (fetched instanceof Error) {
      logger.warn(fetched, "プロフィールの取得に失敗しました");
      return null;
    }
    return profileRecordParser.parse(fetched);
  },
});
