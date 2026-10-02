import type {
  CommitCreateEvent,
  CommitUpdateEvent,
  IdentityEvent,
} from "@skyware/jetstream";
import { Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";

import { Board } from "~/models/board";
import type { ICursorRepository } from "~/server/infrastructure/cursorRepository";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import type { IUserDbRepository } from "~/server/infrastructure/userDbRepository";
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
  handleIdentity: (event: IdentityEvent) => Promise<void>;
  startJetstream: () => Promise<void>;
}

export const jetstreamServiceFactory = ({
  cursorRepository,
  boardService,
  userService,
  userDbRepository,
  identityResolver,
}: {
  cursorRepository: ICursorRepository;
  boardService: IBoardService;
  userService: IUserService;
  userDbRepository: IUserDbRepository;
  identityResolver: IIdentityResolver;
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
    const user = await userService.findUser({
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

  // ハンドルが変わったら、持ち主の写しがあるときだけハンドルを解決し直す。
  // イベントに含まれるハンドルは検証されていないため使わない
  const handleIdentity = async (event: IdentityEvent) => {
    const user = await userDbRepository.findByDid(event.did);
    if (!user) {
      return;
    }
    const resolution = await identityResolver.resolve(event.did);
    if (resolution.type !== "found") {
      logger.warn(
        { did: event.did, resolution },
        "DIDを解決できないためハンドルの更新をスキップしました",
      );
      return;
    }
    const saved = await userDbRepository.save({
      did: user.did,
      avatar: user.avatar,
      avatarCid: user.avatarCid,
      description: user.description,
      displayName: user.displayName,
      handle: resolution.identity.handle,
      updatedAt: new Date(),
    });
    logger.info(
      { did: saved.did, handle: saved.handle },
      "ハンドルを更新しました",
    );
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

  jetstream.on("identity", (event) => {
    handleIdentity(event).catch((error: unknown) => {
      logger.error(error, "ハンドルの更新に失敗しました");
    });
  });

  jetstream.onCreate("blue.linkat.board", handleCreateOrUpdate);

  jetstream.onUpdate("blue.linkat.board", handleCreateOrUpdate);

  jetstream.onDelete("blue.linkat.board", async (event) => {
    await boardService.deleteBoard(event.did);
    logger.info({ userDid: event.did }, "ボードを削除しました");
  });

  return {
    handleCreateOrUpdate,
    handleIdentity,
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
