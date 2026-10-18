import type { Did } from "@atproto/did";
import { Jetstream, type RawEvent, websocketTransport } from "@bsky/jetstream";
import { trace } from "@opentelemetry/api";

import type { ICursorRepository } from "~/server/infrastructure/ingester/cursorRepository";
import type { ILogger } from "~/server/infrastructure/logger/logger";
import type { IMetrics } from "~/server/infrastructure/metrics/metrics";
import type { AccountStateDto } from "~/server/infrastructure/owner/ownerDto";
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
  handleAccount: (event: { did: Did; state: AccountStateDto }) => Promise<void>;
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

  const tracer = trace.getTracer("jetstream");

  const handle = (
    event: RawEvent,
    task: () => Promise<void>,
    errorMessage: string,
  ) => {
    void tracer.startActiveSpan(
      `jetstream ${event.kind}`,
      { root: true },
      (span) =>
        task()
          .catch((error: unknown) => log.error(errorMessage, { error }))
          .finally(() => span.end()),
    );
  };

  const dispatch = (event: RawEvent) => {
    const { did } = event;
    switch (event.kind) {
      case "commit": {
        const { commit } = event;
        if (commit.collection === "blue.linkat.board") {
          handle(
            event,
            () =>
              commit.operation === "delete"
                ? ingesterService.handleBoardDelete({ did })
                : ingesterService.handleBoardCommit({
                    did,
                    record: commit.record,
                  }),
            "ボードの更新に失敗しました",
          );
        }
        if (commit.collection === "app.bsky.actor.profile") {
          handle(
            event,
            () =>
              commit.operation === "delete"
                ? ingesterService.handleProfileDelete({
                    did,
                    rkey: commit.rkey,
                  })
                : ingesterService.handleProfileCommit({
                    did,
                    rkey: commit.rkey,
                    record: commit.record,
                  }),
            "プロフィールの更新に失敗しました",
          );
        }
        return;
      }
      case "identity":
        handle(
          event,
          () => ingesterService.handleIdentity({ did }),
          "ハンドルの更新に失敗しました",
        );
        return;
      case "account":
        handle(
          event,
          () =>
            ingesterService.handleAccount({
              did,
              state: {
                active: event.account.active,
                status: event.account.status ?? null,
              },
            }),
          "アカウントの状態の更新に失敗しました",
        );
        return;
    }
  };

  return {
    async start() {
      let last: { seq: number; time: string } | undefined;
      setInterval(() => {
        if (last) {
          cursorRepository
            .save(last.seq)
            .catch((error: unknown) =>
              log.error("cursorの保存に失敗しました", { error }),
            );
        }
      }, CURSOR_SAVE_INTERVAL_MS).unref();
      setInterval(() => {
        if (last) {
          metrics.setGauge(
            "jetstream_lag_seconds",
            (Date.now() - Date.parse(last.time)) / 1000,
          );
        }
      }, LAG_REPORT_INTERVAL_MS).unref();

      const jetstream = new Jetstream(env.JETSTREAM_SERVICE_URL);
      const events = jetstream.live({
        raw: true,
        collections: ["blue.linkat.board", "app.bsky.actor.profile"],
        kinds: ["commit", "identity", "account"],
        cursor: cursorRepository,
        onError: (error) =>
          log.warn("Jetstreamのイベントを読み飛ばしました", { error }),
        onInfo: (info) => log.warn("Jetstreamから通知を受け取りました", info),
        liveTransport: websocketTransport({
          onReconnect: (error, { attempt }) =>
            log.warn("Jetstreamに再接続します", { error, attempt }),
        }),
      });
      log.info(
        `Jetstream subscription started to ${env.JETSTREAM_SERVICE_URL}`,
      );
      for await (const event of events) {
        last = { seq: event.seq, time: event.time };
        dispatch(event);
      }
      throw new Error("Jetstream subscription ended");
    },
  };
};
