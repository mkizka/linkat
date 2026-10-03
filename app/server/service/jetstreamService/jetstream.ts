import type {
  CommitCreateEvent,
  CommitDeleteEvent,
  CommitUpdateEvent,
} from "@skyware/jetstream";
import { Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";

import { Board } from "~/models/board";
import {
  parseProfileRecord,
  type Profile,
} from "~/server/infrastructure/accountPdsRepository";
import type { ICursorRepository } from "~/server/infrastructure/cursorRepository";
import type { IBoardService } from "~/server/service/boardService/board";
import type { IOwnerService } from "~/server/service/ownerService/owner";
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
  handleProfileCommit: (
    event:
      | CommitCreateEvent<"app.bsky.actor.profile">
      | CommitUpdateEvent<"app.bsky.actor.profile">
      | CommitDeleteEvent<"app.bsky.actor.profile">,
  ) => Promise<void>;
  startJetstream: () => Promise<void>;
}

export const jetstreamServiceFactory = ({
  cursorRepository,
  boardService,
  ownerService,
}: {
  cursorRepository: ICursorRepository;
  boardService: IBoardService;
  ownerService: IOwnerService;
}): IJetstreamService => {
  const jetstream = new Jetstream({
    ws: WebSocket,
    endpoint: env.JETSTREAM_URL,
    wantedCollections: ["blue.linkat.board", "app.bsky.actor.profile"],
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
    const owner = await boardService.saveBoard(board);
    logger.info({ owner, board }, "ボードを更新しました");
  };

  const handleProfileCommit = async (
    event:
      | CommitCreateEvent<"app.bsky.actor.profile">
      | CommitUpdateEvent<"app.bsky.actor.profile">
      | CommitDeleteEvent<"app.bsky.actor.profile">,
  ) => {
    if (event.commit.rkey !== "self") {
      return;
    }
    let profile: Profile;
    if (event.commit.operation === "delete") {
      profile = {
        avatar: null,
        avatarCid: null,
        description: null,
        displayName: null,
      };
    } else {
      const parsed = parseProfileRecord(event.commit.record);
      if (!parsed) {
        logger.warn(
          { did: event.did, record: event.commit.record },
          "プロフィールのパースに失敗しました",
        );
        return;
      }
      profile = parsed;
    }
    const owner = await ownerService.updateProfile({ did: event.did, profile });
    if (owner) {
      logger.info({ owner }, "プロフィールを更新しました");
    }
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
    logger.info({ ownerDid: event.did }, "ボードを削除しました");
  });

  jetstream.onCreate("app.bsky.actor.profile", handleProfileCommit);

  jetstream.onUpdate("app.bsky.actor.profile", handleProfileCommit);

  jetstream.onDelete("app.bsky.actor.profile", handleProfileCommit);

  return {
    handleCreateOrUpdate,
    handleProfileCommit,
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
