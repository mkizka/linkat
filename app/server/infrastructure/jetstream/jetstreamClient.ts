import type {
  AccountEvent,
  CommitCreateEvent,
  CommitDeleteEvent,
  CommitUpdateEvent,
  IdentityEvent,
} from "@skyware/jetstream";
import { Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";

import type { ICursorRepository } from "~/server/infrastructure/jetstream/cursorRepository";
import type { ILogger } from "~/server/infrastructure/logger/logger";
import type { IMetrics } from "~/server/infrastructure/metrics/metrics";
import { env } from "~/utils/env";

const CURSOR_SAVE_INTERVAL_MS = 30_000;

const LAG_REPORT_INTERVAL_MS = 10_000;

export interface IJetstreamHandler {
  handleCreateOrUpdate: (
    event:
      | CommitCreateEvent<"blue.linkat.board">
      | CommitUpdateEvent<"blue.linkat.board">,
  ) => Promise<void>;
  handleBoardDelete: (
    event: CommitDeleteEvent<"blue.linkat.board">,
  ) => Promise<void>;
  handleProfileCommit: (
    event:
      | CommitCreateEvent<"app.bsky.actor.profile">
      | CommitUpdateEvent<"app.bsky.actor.profile">
      | CommitDeleteEvent<"app.bsky.actor.profile">,
  ) => Promise<void>;
  handleIdentity: (event: IdentityEvent) => Promise<void>;
  handleAccount: (event: AccountEvent) => Promise<void>;
}

export interface IJetstreamClient {
  start: (handler: IJetstreamHandler) => Promise<void>;
}

export const jetstreamClientFactory = ({
  cursorRepository,
  logger,
  metrics,
}: {
  cursorRepository: ICursorRepository;
  logger: ILogger;
  metrics: IMetrics;
}): IJetstreamClient => {
  const log = logger.child("jetstream");

  return {
    async start(handler) {
      const jetstream = new Jetstream({
        ws: WebSocket,
        endpoint: env.JETSTREAM_URL,
        wantedCollections: ["blue.linkat.board", "app.bsky.actor.profile"],
      });

      const logError = (message: string) => (error: unknown) => {
        log.error(message, { error });
      };
      const logBoardError = logError("ボードの更新に失敗しました");
      const logProfileError = logError("プロフィールの更新に失敗しました");

      jetstream.on("open", () => {
        log.info(`Jetstream subscription started to ${env.JETSTREAM_URL}`);
      });
      jetstream.on("close", () => {
        log.info(`Jetstream subscription closed`);
      });
      jetstream.on("error", (error) => {
        log.error("Jetstreamでエラーが発生しました", { error });
      });
      jetstream.on("identity", (event) => {
        handler
          .handleIdentity(event)
          .catch(logError("ハンドルの更新に失敗しました"));
      });
      jetstream.on("account", (event) => {
        handler
          .handleAccount(event)
          .catch(logError("アカウントの状態の更新に失敗しました"));
      });
      jetstream.onCreate("blue.linkat.board", (event) => {
        handler.handleCreateOrUpdate(event).catch(logBoardError);
      });
      jetstream.onUpdate("blue.linkat.board", (event) => {
        handler.handleCreateOrUpdate(event).catch(logBoardError);
      });
      jetstream.onDelete("blue.linkat.board", (event) => {
        handler.handleBoardDelete(event).catch(logBoardError);
      });
      jetstream.onCreate("app.bsky.actor.profile", (event) => {
        handler.handleProfileCommit(event).catch(logProfileError);
      });
      jetstream.onUpdate("app.bsky.actor.profile", (event) => {
        handler.handleProfileCommit(event).catch(logProfileError);
      });
      jetstream.onDelete("app.bsky.actor.profile", (event) => {
        handler.handleProfileCommit(event).catch(logProfileError);
      });

      const savedCursor = await cursorRepository.load();
      if (savedCursor !== undefined) {
        jetstream.cursor = savedCursor;
      }
      jetstream.start();
      setInterval(() => {
        if (jetstream.cursor !== undefined) {
          cursorRepository
            .save(jetstream.cursor)
            .catch(logError("cursorの保存に失敗しました"));
        }
      }, CURSOR_SAVE_INTERVAL_MS).unref();
      setInterval(() => {
        if (jetstream.cursor !== undefined) {
          metrics.gauge(
            "jetstream.lag",
            Date.now() * 1000 - jetstream.cursor,
            "microsecond",
          );
        }
      }, LAG_REPORT_INTERVAL_MS).unref();
    },
  };
};
