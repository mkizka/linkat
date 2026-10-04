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
}

const fetchProfileRecord = async ({ did, pds }: { did: Did; pds: string }) => {
  logger.info({ did, pds }, "プロフィールを取得します");
  const agent = LinkatAgent.credential(pds);
  const { value } = await agent.get(profile, { repo: did });
  return value;
};

export const accountPdsRepositoryFactory = ({
  identityResolver,
  profileRecordParser,
}: {
  identityResolver: IIdentityResolver;
  profileRecordParser: IProfileRecordParser;
}): IAccountPdsRepository => ({
  async findByDid(did) {
    const identity = await identityResolver.resolve(did);
    if (!identity) {
      return null;
    }
    const fetched = await tryCatch(fetchProfileRecord)(identity);
    if (fetched instanceof Error) {
      logger.warn(fetched, "プロフィールの取得に失敗しました");
    }
    return {
      handle: identity.handle,
      profile:
        fetched instanceof Error ? null : profileRecordParser.parse(fetched),
    };
  },
});
