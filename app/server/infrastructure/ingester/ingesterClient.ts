import type { Did } from "@atproto/did";
import * as Sentry from "@sentry/react-router";
import { Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";

import type { AccountState } from "~/models/owner";
import type { ICursorRepository } from "~/server/infrastructure/ingester/cursorRepository";
import type { ILogger } from "~/server/infrastructure/logger/logger";
import type { IMetrics } from "~/server/infrastructure/metrics/metrics";
import { env } from "~/utils/env";

const CURSOR_SAVE_INTERVAL_MS = 30_000;

const LAG_REPORT_INTERVAL_MS = 10_000;

export interface IIngesterHandler {
  handleBoardCommit: (event: { did: Did; record: unknown }) => Promise<void>;
  handleBoardDelete: (event: { did: Did }) => Promise<void>;
  handleProfileCommit: (event: {
    did: Did;
    rkey: string;
    record: unknown;
  }) => Promise<void>;
  handleProfileDelete: (event: { did: Did; rkey: string }) => Promise<void>;
  handleIdentity: (event: { did: Did }) => Promise<void>;
  handleAccount: (event: { did: Did; state: AccountState }) => Promise<void>;
}

export interface IIngesterClient {
  start: () => Promise<void>;
}

export const ingesterClientFactory = ({
  ingesterService,
  cursorRepository,
  logger,
  metrics,
}: {
  ingesterService: IIngesterHandler;
  cursorRepository: ICursorRepository;
  logger: ILogger;
  metrics: IMetrics;
}): IIngesterClient => {
  const log = logger.child("jetstream");

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

  const handle =
    <E>(task: (event: E) => Promise<void>, onError: (error: unknown) => void) =>
    (event: E) => {
      void Sentry.startNewTrace(() => task(event).catch(onError));
    };

  jetstream.on("open", () => {
    log.info(`Jetstream subscription started to ${env.JETSTREAM_URL}`);
  });
  jetstream.on("close", () => {
    log.info(`Jetstream subscription closed`);
  });
  jetstream.on("error", (error) => {
    log.error("Jetstreamでエラーが発生しました", { error });
  });
  jetstream.on(
    "identity",
    handle(
      ({ did }) => ingesterService.handleIdentity({ did }),
      logError("ハンドルの更新に失敗しました"),
    ),
  );
  jetstream.on(
    "account",
    handle(
      ({ did, account }) =>
        ingesterService.handleAccount({
          did,
          state: { active: account.active, status: account.status ?? null },
        }),
      logError("アカウントの状態の更新に失敗しました"),
    ),
  );
  jetstream.onCreate(
    "blue.linkat.board",
    handle(
      ({ did, commit }) =>
        ingesterService.handleBoardCommit({ did, record: commit.record }),
      logBoardError,
    ),
  );
  jetstream.onUpdate(
    "blue.linkat.board",
    handle(
      ({ did, commit }) =>
        ingesterService.handleBoardCommit({ did, record: commit.record }),
      logBoardError,
    ),
  );
  jetstream.onDelete(
    "blue.linkat.board",
    handle(
      ({ did }) => ingesterService.handleBoardDelete({ did }),
      logBoardError,
    ),
  );
  jetstream.onCreate(
    "app.bsky.actor.profile",
    handle(
      ({ did, commit }) =>
        ingesterService.handleProfileCommit({
          did,
          rkey: commit.rkey,
          record: commit.record,
        }),
      logProfileError,
    ),
  );
  jetstream.onUpdate(
    "app.bsky.actor.profile",
    handle(
      ({ did, commit }) =>
        ingesterService.handleProfileCommit({
          did,
          rkey: commit.rkey,
          record: commit.record,
        }),
      logProfileError,
    ),
  );
  jetstream.onDelete(
    "app.bsky.actor.profile",
    handle(
      ({ did, commit }) =>
        ingesterService.handleProfileDelete({ did, rkey: commit.rkey }),
      logProfileError,
    ),
  );

  return {
    async start() {
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
          metrics.setGauge(
            "jetstream_lag_seconds",
            (Date.now() * 1000 - jetstream.cursor) / 1_000_000,
          );
        }
      }, LAG_REPORT_INTERVAL_MS).unref();
    },
  };
};
