import type { Did } from "@atproto/did";
import { Jetstream, LexIndexer, websocketTransport } from "@bsky/jetstream";
import { trace } from "@opentelemetry/api";

import profile from "~/generated/app/bsky/actor/profile";
import board from "~/generated/blue/linkat/board";
import type { ICursorRepository } from "~/server/infrastructure/ingester/cursorRepository";
import type { ILogger } from "~/server/infrastructure/logger/logger";
import type { IMetrics } from "~/server/infrastructure/metrics/metrics";
import type { AccountStateDto } from "~/server/infrastructure/owner/ownerDto";
import { env } from "~/utils/env";

const LAG_REPORT_INTERVAL_MS = 10_000;

const OLDEST_TIMESTAMP_CURSOR = 1e15;

const errorMessages = (error: unknown): string[] =>
  error instanceof Error ? [error.message, ...errorMessages(error.cause)] : [];

const isCursorTooOld = (error: unknown) =>
  errorMessages(error).some((message) =>
    message.includes("Unexpected server response: 400"),
  );

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

  let lastEventTime: string | undefined;

  const handle = (kind: string, task: () => Promise<void>, time?: string) => {
    if (time) {
      lastEventTime = time;
    }
    return tracer.startActiveSpan(`jetstream ${kind}`, { root: true }, (span) =>
      task().finally(() => span.end()),
    );
  };

  const indexer = new LexIndexer()
    .commit(board, {
      put: (e) =>
        handle("commit", () =>
          ingesterService.handleBoardCommit({ did: e.did, record: e.record }),
        ),
      del: (e) =>
        handle("commit", () =>
          ingesterService.handleBoardDelete({ did: e.did }),
        ),
    })
    .commit(profile, {
      put: (e) =>
        handle("commit", () =>
          ingesterService.handleProfileCommit({
            did: e.did,
            rkey: e.rkey,
            record: e.record,
          }),
        ),
      del: (e) =>
        handle("commit", () =>
          ingesterService.handleProfileDelete({ did: e.did, rkey: e.rkey }),
        ),
    })
    .identity((e) =>
      handle(
        "identity",
        () => ingesterService.handleIdentity({ did: e.did }),
        e.time,
      ),
    )
    .account((e) =>
      handle(
        "account",
        () =>
          ingesterService.handleAccount({
            did: e.did,
            state: { active: e.active, status: e.status ?? null },
          }),
        e.time,
      ),
    )
    .onValidationError((e) =>
      log.warn("レコードの検証に失敗しました", { uri: e.uri, error: e.error }),
    );

  return {
    async start() {
      setInterval(() => {
        if (lastEventTime) {
          metrics.setGauge(
            "jetstream_lag_seconds",
            (Date.now() - Date.parse(lastEventTime)) / 1000,
          );
        }
      }, LAG_REPORT_INTERVAL_MS).unref();

      const runner = new Jetstream(env.JETSTREAM_SERVICE_URL).runner(indexer);
      const live = () =>
        runner.live({
          cursor: cursorRepository,
          onInfo: (info) => log.warn("Jetstreamから通知を受け取りました", info),
          onError: (error) =>
            log.error("Jetstreamから読み取れないフレームを受け取りました", {
              error,
            }),
          liveTransport: websocketTransport({
            onReconnect: (error, { attempt }) =>
              log.warn("Jetstreamに再接続します", { error, attempt }),
          }),
        });
      log.info(
        `Jetstream subscription started to ${env.JETSTREAM_SERVICE_URL}`,
      );
      try {
        await live();
      } catch (error) {
        if (!isCursorTooOld(error)) {
          throw error;
        }
        log.error(
          "cursorが保持期間より古いため、残っている最古のイベントから購読し直します",
          { error },
        );
        await cursorRepository.save(OLDEST_TIMESTAMP_CURSOR);
        await live();
      }
      throw new Error("Jetstream subscription ended");
    },
  };
};
