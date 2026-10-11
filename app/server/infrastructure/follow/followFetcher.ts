import { asDid, type Did } from "@atproto/did";
import { Client } from "@atproto/lex";

import getFollows from "~/generated/app/bsky/graph/getFollows";
import type { ILogger } from "~/server/infrastructure/logger/logger";
import { env } from "~/utils/env";
import { tryCatch } from "~/utils/tryCatch";

const MAX_FOLLOWS = 5000;

export interface IFollowFetcher {
  fetchFollowDids: (did: Did) => Promise<Did[] | Error>;
}

const fetchFollowDids = async (did: Did) => {
  const client = new Client(env.BSKY_PUBLIC_API_URL);
  const dids: Did[] = [];
  let cursor: string | undefined;
  do {
    const response = await client.call(getFollows, {
      actor: did,
      limit: 100,
      cursor,
    });
    dids.push(...response.follows.map((follow) => asDid(follow.did)));
    cursor = response.cursor;
  } while (cursor && dids.length < MAX_FOLLOWS);
  return dids.slice(0, MAX_FOLLOWS);
};

export const followFetcherFactory = ({
  logger,
}: {
  logger: ILogger;
}): IFollowFetcher => {
  const log = logger.child("followFetcher");
  return {
    async fetchFollowDids(did) {
      log.info("フォロー一覧を取得します", { did });
      const fetched = await tryCatch(fetchFollowDids)(did);
      if (fetched instanceof Error) {
        log.warn("フォロー一覧の取得に失敗しました", { error: fetched });
      }
      return fetched;
    },
  };
};
