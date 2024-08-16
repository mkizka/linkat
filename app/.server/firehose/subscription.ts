import type { ComAtprotoSyncSubscribeRepos } from "@atproto/api";

import { boardService } from "~/.server/service/boardService";
import { serverEnv } from "~/.server/utils/server-env";
import { boardScheme } from "~/models/board";
import { createLogger } from "~/utils/logger";

import type { FirehoseOperation } from "./subscription-base";
import { FirehoseSubscriptionBase } from "./subscription-base";

const logger = createLogger("firehose");

class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handle(
    operations: FirehoseOperation[],
    _: ComAtprotoSyncSubscribeRepos.Commit,
  ) {
    for (const operation of operations) {
      const parsed = boardScheme.safeParse(operation.record);
      if (!parsed.success) continue;
      const board = await boardService.createOrUpdateBoard(
        operation.repo,
        parsed.data,
      );
      logger.info("ボードを更新しました", { board });
    }
  }
}

export const startFirehoseSubscription = () => {
  logger.info(
    `Firehose subscription started to ${serverEnv.BSKY_FIREHOSE_URL}`,
  );
  const subscription = new FirehoseSubscription({
    service: serverEnv.BSKY_FIREHOSE_URL,
  });
  void subscription.run({ reconnectDelay: 1000 });
};
