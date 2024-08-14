import type { ComAtprotoSyncSubscribeRepos } from "@atproto/api";

import { serverEnv } from "~/.server/utils/server-env";
import { DevMkizkaTestProfileBoard } from "~/generated/api";
import { createLogger } from "~/utils/logger";

import type { FirehoseOperation } from "./subscription-base";
import { FirehoseSubscriptionBase } from "./subscription-base";

const logger = createLogger("firehose");

class FirehoseSubscription extends FirehoseSubscriptionBase {
  handle(
    operations: FirehoseOperation[],
    _: ComAtprotoSyncSubscribeRepos.Commit,
  ): Promise<void> | void {
    for (const operation of operations) {
      if (!DevMkizkaTestProfileBoard.isRecord(operation.record)) continue;
      logger.info("Firehose operation", operation);
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
