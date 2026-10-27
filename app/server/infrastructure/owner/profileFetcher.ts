import type { Did } from "@atproto/did";
import { Client, XrpcResponseError } from "@atproto/lex";

import profile from "~/generated/app/bsky/actor/profile";
import type { ILogger } from "~/server/infrastructure/logger/logger";
import type { ProfileDto } from "~/server/infrastructure/owner/ownerDto";
import type { IProfileRecordParser } from "~/server/infrastructure/owner/profileRecordParser";
import { tryCatch } from "~/utils/tryCatch";

export interface IProfileFetcher {
  fetchProfile: (pds: URL, did: Did) => Promise<ProfileDto | null | Error>;
}

const fetchProfileRecord = async (pds: URL, did: Did) => {
  const { value } = await new Client(pds).get(profile, { repo: did });
  return value;
};

export const profileFetcherFactory = ({
  profileRecordParser,
  logger,
}: {
  profileRecordParser: IProfileRecordParser;
  logger: ILogger;
}): IProfileFetcher => {
  const log = logger.child("profileFetcher");
  return {
    async fetchProfile(pds, did) {
      log.info("プロフィールを取得します", { did });
      const fetched = await tryCatch(fetchProfileRecord)(pds, did);
      if (
        fetched instanceof XrpcResponseError &&
        fetched.error === "RecordNotFound"
      ) {
        return null;
      }
      if (fetched instanceof Error) {
        log.warn("プロフィールの取得に失敗しました", { error: fetched });
        return fetched;
      }
      return (
        profileRecordParser.parse(fetched) ??
        new Error("プロフィールのパースに失敗しました")
      );
    },
  };
};
