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
  logger.error(error, "Jetstreamでエラーが発生しました");
});

const handleCreateOrUpdate = async (
  event:
    | CommitCreateEvent<"blue.linkat.board">
    | CommitUpdateEvent<"blue.linkat.board">,
) => {
  const parsed = boardScheme.safeParse(event.commit.record);
  if (!parsed.success) {
    logger.warn(
      {
        record: event.commit.record,
        error: fromZodError(parsed.error).toString(),
      },
      "ボードのパースに失敗しました",
    );
    return;
  }
  const user = await userService.findOrFetchUser({
    handleOrDid: event.did,
  });
  const board = await boardService.createOrUpdateBoard({
    userDid: event.did,
    board: parsed.data,
  });
  logger.info({ user, board }, "ボードを更新しました");
};

jetstream.onCreate("blue.linkat.board", handleCreateOrUpdate);

jetstream.onUpdate("blue.linkat.board", handleCreateOrUpdate);

jetstream.onDelete("blue.linkat.board", async (event) => {
  await boardService.deleteBoard(event.did);
  logger.info({ userDid: event.did }, "ボードを削除しました");
});
