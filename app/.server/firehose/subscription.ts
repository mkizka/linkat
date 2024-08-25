import type { ComAtprotoSyncSubscribeRepos } from "@atproto/api";
import { fromZodError } from "zod-validation-error";

import { boardService } from "~/.server/service/boardService";
import { userService } from "~/.server/service/userService";
import { DevMkizkaTestProfileBoard } from "~/generated/api";
import { boardScheme } from "~/models/board";
import { env } from "~/utils/env";
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
      if (!DevMkizkaTestProfileBoard.isRecord(operation.record)) {
        continue;
      }
      const parsed = boardScheme.safeParse(operation.record);
      if (!parsed.success) {
        logger.warn("ボードのパースに失敗しました", {
          operation,
          error: fromZodError(parsed.error),
        });
        continue;
      }
      const user = await userService.findOrFetchUser({
        handleOrDid: operation.repo,
      });
      const board = await boardService.createOrUpdateBoard({
        userDid: operation.repo,
        board: parsed.data,
      });
      logger.info("ボードを更新しました", { user, board });
    }
  }
}

export const startFirehoseSubscription = () => {
  logger.info(`Firehose subscription started to ${env.BSKY_FIREHOSE_URL}`);
  const subscription = new FirehoseSubscription({
    service: env.BSKY_FIREHOSE_URL,
  });
  void subscription.run({ reconnectDelay: 1000 });
};
