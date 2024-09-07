import { IdResolver } from "@atproto/identity";
import type {
  Create as FirehoseCreateEvt,
  Update as FirehoseUpdateEvt,
} from "@atproto/sync";
import { Firehose } from "@atproto/sync";
import { fromZodError } from "zod-validation-error";

import { boardScheme } from "~/models/board";
import { boardService } from "~/server/service/boardService";
import { userService } from "~/server/service/userService";
import { env } from "~/utils/env";
import { createLogger } from "~/utils/logger";

const logger = createLogger("firehose");

const idResolver = new IdResolver({
  plcUrl: env.ATPROTO_PCL_URL,
});

const handleCreateOrUpdate = async (
  evt: FirehoseCreateEvt | FirehoseUpdateEvt,
) => {
  if (evt.collection !== "dev.mkizka.test.board") {
    return;
  }
  const parsed = boardScheme.safeParse(evt.record);
  if (!parsed.success) {
    logger.warn("ボードのパースに失敗しました", {
      record: evt.record,
      error: fromZodError(parsed.error),
    });
    return;
  }
  const user = await userService.findOrFetchUser({
    handleOrDid: evt.uri.host,
  });
  const board = await boardService.createOrUpdateBoard({
    userDid: evt.uri.host,
    board: parsed.data,
  });
  logger.info("ボードを更新しました", { user, board });
};

export const firehose = new Firehose({
  idResolver,
  service: env.BSKY_FIREHOSE_URL,
  handleEvent: async (evt) => {
    logger.debug("Firehoseイベント", {
      event: evt.event,
      uri: "uri" in evt ? evt.uri.toString() : null,
    });
    if (evt.event === "create" || evt.event === "update") {
      await handleCreateOrUpdate(evt);
    } else if (evt.event === "delete") {
      // TODO: 削除機能を実装する
    }
  },
  onError: (error) => {
    logger.warn("Firehoseでエラーが発生しました", { error: error.message });
  },
  filterCollections: ["dev.mkizka.test.board"],
  excludeIdentity: true,
  excludeAccount: true,
});
