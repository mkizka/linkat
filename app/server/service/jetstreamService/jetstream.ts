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
import type { ICursorRepository } from "~/server/infrastructure/cursorRepository";
import type { IProfileRecordParser } from "~/server/infrastructure/profileRecordParser";
import type { IBoardEventService } from "~/server/service/boardEventService/boardEvent";
import type { IOwnerService } from "~/server/service/ownerService/owner";
import { env } from "~/utils/env";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("jetstream");

const CURSOR_SAVE_INTERVAL_MS = 30_000;

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
}: {
  cursorRepository: ICursorRepository;
  boardEventService: IBoardEventService;
  ownerService: IOwnerService;
  profileRecordParser: IProfileRecordParser;
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
    const board = await tryCatch(() =>
      Board.fromRecord(event.did, event.commit.record),
    )();
    if (board instanceof Error) {
      logger.warn(
        { record: event.commit.record },
        "ボードのパースに失敗しました",
      );
      return;
    }
    await boardEventService.handleBoardCommit(board);
    logger.debug({ board }, "ボードを更新しました");
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
      logger.warn({ event }, "プロフィールのパースに失敗しました");
      return;
    }
    const saved = await ownerService.updateProfile(event.did, profile);
    if (saved) {
      logger.debug({ owner: saved }, "プロフィールを更新しました");
    }
  };

  const handleIdentity = async (event: IdentityEvent) => {
    const saved = await ownerService.refreshHandle(event.did);
    if (saved) {
      logger.info(
        { did: saved.did, handle: saved.handle },
        "ハンドルを更新しました",
      );
    }
  };

  const handleAccount = async ({ account }: AccountEvent) => {
    const state = { active: account.active, status: account.status ?? null };
    await ownerService.updateAccountState(account.did, state);
    logger.debug(
      { did: account.did, ...state },
      "アカウントの状態を受け取りました",
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

  jetstream.on("account", (event) => {
    handleAccount(event).catch((error: unknown) => {
      logger.error(error, "アカウントの状態の更新に失敗しました");
    });
  });

  jetstream.onCreate("blue.linkat.board", handleCreateOrUpdate);

  jetstream.onUpdate("blue.linkat.board", handleCreateOrUpdate);

  jetstream.onDelete("blue.linkat.board", async (event) => {
    await boardEventService.handleBoardDeleteCommit(event.did);
    logger.info({ ownerDid: event.did }, "ボードを削除しました");
  });

  jetstream.onCreate("app.bsky.actor.profile", handleProfileCommit);

  jetstream.onUpdate("app.bsky.actor.profile", handleProfileCommit);

  jetstream.onDelete("app.bsky.actor.profile", handleProfileCommit);

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
            logger.error(error, "cursorの保存に失敗しました");
          });
        }
      }, CURSOR_SAVE_INTERVAL_MS).unref();
    },
  };
};
