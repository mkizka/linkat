import type { CommitCreateEvent, CommitUpdateEvent } from "@skyware/jetstream";
import { Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";

import { Board } from "~/models/board";
import type { ICursorRepository } from "~/server/infrastructure/cursorRepository";
import type { IBoardService } from "~/server/service/boardService/board";
import type { IUserService } from "~/server/service/userService/user";
import { env } from "~/utils/env";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("jetstream");

const CURSOR_SAVE_INTERVAL_MS = 30_000;

export interface IJetstreamService {
  handleCreateOrUpdate: (
    event:
      | CommitCreateEvent<"blue.linkat.board">
      | CommitUpdateEvent<"blue.linkat.board">,
  ) => Promise<void>;
  startJetstream: () => Promise<void>;
}

export const jetstreamServiceFactory = ({
  cursorRepository,
  boardService,
  userService,
}: {
  cursorRepository: ICursorRepository;
  boardService: IBoardService;
  userService: IUserService;
}): IJetstreamService => {
  const jetstream = new Jetstream({
    ws: WebSocket,
    endpoint: env.JETSTREAM_URL,
    wantedCollections: ["blue.linkat.board"],
  });

  const handleCreateOrUpdate = async (
    event:
      | CommitCreateEvent<"blue.linkat.board">
      | CommitUpdateEvent<"blue.linkat.board">,
  ) => {
    const cards = await tryCatch((input: unknown) => Board.parseCards(input))(
      event.commit.record,
    );
    if (cards instanceof Error) {
      logger.warn(
        { record: event.commit.record },
        "ボードのパースに失敗しました",
      );
      return;
    }
    const board = new Board(event.did, cards);
    const user = await userService.findOrFetchUser({
      handleOrDid: event.did,
    });
    if (!user) {
      logger.warn(
        { did: event.did },
        "ユーザーが見つからないためボードの更新をスキップしました",
      );
      return;
    }
    await boardService.saveBoard(board);
    logger.info({ user, board }, "ボードを更新しました");
  };

  jetstream.on("open", () => {
    logger.info(`Jetstream subscription started to ${env.JETSTREAM_URL}`);
  });

  jetstream.on("close", () => {
    logger.info(`Jetstream subscription closed`);
  });

  jetstream.on("error", (error) => {
    logger.error(error, "Jetstreamでエラーが発生しました");
  });

  jetstream.onCreate("blue.linkat.board", handleCreateOrUpdate);

  jetstream.onUpdate("blue.linkat.board", handleCreateOrUpdate);

  jetstream.onDelete("blue.linkat.board", async (event) => {
    await boardService.deleteBoard(event.did);
    logger.info({ userDid: event.did }, "ボードを削除しました");
  });

  return {
    handleCreateOrUpdate,
    async startJetstream() {
      const savedCursor = await cursorRepository.load();
      if (savedCursor !== undefined) {
        jetstream.cursor = savedCursor;
      }
      jetstream.start();
      setInterval(() => {
        if (jetstream.cursor !== undefined) {
          cursorRepository.save(jetstream.cursor).catch((error: unknown) => {
            logger.error(error, "cursorの保存に失敗しました");
          });
        }
      }, CURSOR_SAVE_INTERVAL_MS).unref();
    },
  };
};
