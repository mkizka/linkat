import { lexParse } from "@atproto/lex";
import type {
  AccountEvent,
  CommitCreateEvent,
  CommitDeleteEvent,
  CommitUpdateEvent,
  IdentityEvent,
} from "@skyware/jetstream";
import { Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";

import { Board } from "~/models/board";
import type { ICursorRepository } from "~/server/infrastructure/jetstream/cursorRepository";
import type { ILogger } from "~/server/infrastructure/logger/logger";
import type { IMetrics } from "~/server/infrastructure/metrics/metrics";
import type { IProfileRecordParser } from "~/server/infrastructure/owner/profileRecordParser";
import type { IBoardEventService } from "~/server/service/board/boardEvent";
import type { IOwnerService } from "~/server/service/owner/owner";
import { env } from "~/utils/env";
import { tryCatch } from "~/utils/tryCatch";

const CURSOR_SAVE_INTERVAL_MS = 30_000;

const LAG_REPORT_INTERVAL_MS = 10_000;

const jsonToLex = tryCatch((json: unknown) => lexParse(JSON.stringify(json)));

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
  handleIdentity: (event: IdentityEvent) => Promise<void>;
  handleAccount: (event: AccountEvent) => Promise<void>;
  startJetstream: () => Promise<void>;
}

export const jetstreamServiceFactory = ({
  cursorRepository,
  boardEventService,
  ownerService,
  profileRecordParser,
  logger,
  metrics,
}: {
  cursorRepository: ICursorRepository;
  boardEventService: IBoardEventService;
  ownerService: IOwnerService;
  profileRecordParser: IProfileRecordParser;
  logger: ILogger;
  metrics: IMetrics;
}): IJetstreamService => {
  const log = logger.child("jetstream");
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
    const board = await tryCatch(() =>
      Board.fromRecord(event.did, event.commit.record),
    )();
    if (board instanceof Error) {
      log.warn("ボードのパースに失敗しました", {
        record: event.commit.record,
      });
      return;
    }
    await boardEventService.handleBoardCommit(board);
    log.info("ボードを更新しました", {
      ownerDid: board.ownerDid,
      cardCount: board.cards.length,
    });
  };

  const parseProfile = async (json: unknown) => {
    const record = await jsonToLex(json);
    return record instanceof Error ? null : profileRecordParser.parse(record);
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
    const profile =
      event.commit.operation === "delete"
        ? null
        : await parseProfile(event.commit.record);
    if (event.commit.operation !== "delete" && !profile) {
      log.warn("プロフィールのパースに失敗しました", { event });
      return;
    }
    const saved = await ownerService.updateProfile(event.did, profile);
    if (saved) {
      log.debug("プロフィールを更新しました", { owner: saved });
    }
  };

  const handleIdentity = async (event: IdentityEvent) => {
    const saved = await ownerService.refreshHandle(event.did);
    if (saved) {
      log.info("ハンドルを更新しました", {
        did: saved.did,
        handle: saved.handle,
      });
    }
  };

  const handleAccount = async ({ account }: AccountEvent) => {
    const state = { active: account.active, status: account.status ?? null };
    await ownerService.updateAccountState(account.did, state);
    log.debug("アカウントの状態を受け取りました", {
      did: account.did,
      ...state,
    });
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

  jetstream.on("identity", (event) => {
    handleIdentity(event).catch((error: unknown) => {
      log.error("ハンドルの更新に失敗しました", { error });
    });
  });

  jetstream.on("account", (event) => {
    handleAccount(event).catch((error: unknown) => {
      log.error("アカウントの状態の更新に失敗しました", { error });
    });
  });

  const handleBoardDelete = async (
    event: CommitDeleteEvent<"blue.linkat.board">,
  ) => {
    await boardEventService.handleBoardDeleteCommit(event.did);
    log.info("ボードを削除しました", { ownerDid: event.did });
  };

  const logBoardError = (error: unknown) => {
    log.error("ボードの更新に失敗しました", { error });
  };

  const logProfileError = (error: unknown) => {
    log.error("プロフィールの更新に失敗しました", { error });
  };

  jetstream.onCreate("blue.linkat.board", (event) => {
    handleCreateOrUpdate(event).catch(logBoardError);
  });

  jetstream.onUpdate("blue.linkat.board", (event) => {
    handleCreateOrUpdate(event).catch(logBoardError);
  });

  jetstream.onDelete("blue.linkat.board", (event) => {
    handleBoardDelete(event).catch(logBoardError);
  });

  jetstream.onCreate("app.bsky.actor.profile", (event) => {
    handleProfileCommit(event).catch(logProfileError);
  });

  jetstream.onUpdate("app.bsky.actor.profile", (event) => {
    handleProfileCommit(event).catch(logProfileError);
  });

  jetstream.onDelete("app.bsky.actor.profile", (event) => {
    handleProfileCommit(event).catch(logProfileError);
  });

  return {
    handleCreateOrUpdate,
    handleProfileCommit,
    handleIdentity,
    handleAccount,
    async startJetstream() {
      const savedCursor = await cursorRepository.load();
      if (savedCursor !== undefined) {
        jetstream.cursor = savedCursor;
      }
      jetstream.start();
      setInterval(() => {
        if (jetstream.cursor !== undefined) {
          cursorRepository.save(jetstream.cursor).catch((error: unknown) => {
            log.error("cursorの保存に失敗しました", { error });
          });
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
