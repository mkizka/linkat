import type { CommitCreateEvent, CommitUpdateEvent } from "@skyware/jetstream";
import { Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";
import { fromZodError } from "zod-validation-error";

import { boardScheme } from "~/models/board";
import { boardService } from "~/server/service/boardService";
import { userService } from "~/server/service/userService";
import { env } from "~/utils/env";
import { createLogger } from "~/utils/logger";

const logger = createLogger("jetstream");

export const jetstream = new Jetstream({
  ws: WebSocket,
  endpoint: env.JETSTREAM_URL,
  wantedCollections: ["blue.linkat.board"],
});

jetstream.on("open", () => {
  logger.info(`Jetstream subscription started to ${env.JETSTREAM_URL}`);
});

jetstream.on("close", () => {
  logger.info(`Jetstream subscription closed`);
});

jetstream.on("error", (error) => {
  logger.error("Jetstreamでエラーが発生しました", {
    error: String(error),
  });
});

const handleCreateOrUpdate = async (
  event:
    | CommitCreateEvent<"blue.linkat.board">
    | CommitUpdateEvent<"blue.linkat.board">,
) => {
  const parsed = boardScheme.safeParse(event.commit.record);
  if (!parsed.success) {
    logger.warn("ボードのパースに失敗しました", {
      record: event.commit.record,
      error: fromZodError(parsed.error).toString(),
    });
    return;
  }
  const user = await userService.findOrFetchUser({
    handleOrDid: event.did,
  });
  const board = await boardService.createOrUpdateBoard({
    userDid: event.did,
    board: parsed.data,
  });
  logger.info("ボードを更新しました", { user, board });
};

jetstream.onCreate("blue.linkat.board", handleCreateOrUpdate);

jetstream.onUpdate("blue.linkat.board", handleCreateOrUpdate);

jetstream.onDelete("blue.linkat.board", async (event) => {
  await boardService.deleteBoard(event.did);
  logger.info("ボードを削除しました", { userDid: event.did });
});
