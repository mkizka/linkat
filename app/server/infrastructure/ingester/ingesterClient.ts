import { setTimeout } from "node:timers/promises";

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
const RETRY_INTERVAL_MS = 10_000;

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
  handleSync: (event: { did: Did }) => Promise<void>;
}

export interface IIngesterClient {
  start: () => Promise<never>;
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

  let lastEventTime = new Date().toISOString();

  const handle = (kind: string, task: () => Promise<void>) =>
    tracer.startActiveSpan(`jetstream.${kind}`, { root: true }, (span) =>
      task().finally(() => span.end()),
    );

  const indexer = new LexIndexer({
    // 各イベントのtimeを記録するために処理を上書きしている
    // 返り値はデフォルトの処理と同じ
    keyOf: (event) => {
      lastEventTime = event.time;
      return event.kind === "commit"
        ? `${event.did}/${event.commit.collection}/${event.commit.rkey}`
        : event.did;
    },
  })
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
      handle("identity", () => ingesterService.handleIdentity({ did: e.did })),
    )
    .account((e) =>
      handle("account", () =>
        ingesterService.handleAccount({
          did: e.did,
          state: { active: e.active, status: e.status ?? null },
        }),
      ),
    )
    .sync((e) =>
      handle("sync", () => ingesterService.handleSync({ did: e.did })),
    )
    .onValidationError((e) =>
      log.warn("レコードの検証に失敗しました", { uri: e.uri, error: e.error }),
    );

  return {
    async start() {
      setInterval(() => {
        metrics.setGauge(
          "jetstream_lag_seconds",
          (Date.now() - Date.parse(lastEventTime)) / 1000,
        );
      }, LAG_REPORT_INTERVAL_MS).unref();

      const runner = new Jetstream({
        service: env.JETSTREAM_SERVICE_URL,
        apiKey: env.JETSTREAM_API_KEY,
      }).runner(indexer);
      const options = {
        cursor: cursorRepository,
        onInfo: (info: { name: string; message?: string }) =>
          log.warn("Jetstreamから通知を受け取りました", info),
        onError: (error: Error) =>
          log.error("Jetstreamからの読み取りに失敗しました", { error }),
        liveTransport: websocketTransport({
          onReconnect: (error, { attempt }) =>
            log.warn("Jetstreamに再接続します", { error, attempt }),
        }),
      };

      for (;;) {
        try {
          const cursor = await cursorRepository.load();
          if (env.JETSTREAM_API_KEY && cursor !== undefined) {
            log.info(`Jetstreamをcursor=${cursor}から読み直します`);
            await runner.replay(options);
          } else {
            log.info("Jetstreamを購読します");
            await runner.live(options);
          }
          log.error("Jetstreamの購読が終了しました");
        } catch (error) {
          log.error("Jetstreamの購読が停止しました", { error });
        }
        await setTimeout(RETRY_INTERVAL_MS);
      }
    },
  };
};
