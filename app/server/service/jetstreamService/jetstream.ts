import type {
  AccountEvent,
  CommitCreateEvent,
  CommitUpdateEvent,
  IdentityEvent,
} from "@skyware/jetstream";
import { Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";

import { Board } from "~/models/board";
import type { AccountStatus } from "~/models/user";
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

const toAccountStatus = (account: AccountEvent["account"]): AccountStatus => {
  if (account.active) {
    return "active";
  }
  switch (account.status) {
    case "takendown":
    case "suspended":
      return "suspended";
    case "deleted":
      return "deleted";
    case "deactivated":
      return "deactivated";
    default:
      return "inactive";
  }
};

export interface IJetstreamService {
  handleCreateOrUpdate: (
    event:
      | CommitCreateEvent<"blue.linkat.board">
      | CommitUpdateEvent<"blue.linkat.board">,
  ) => Promise<void>;
  handleIdentity: (event: IdentityEvent) => Promise<void>;
  handleAccount: (event: AccountEvent) => Promise<void>;
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
    const owner = await boardService.saveBoard(board);
    logger.info({ owner, board }, "ボードを更新しました");
  };

  const handleIdentity = async (event: IdentityEvent) => {
    const user = await userDbRepository.findByDid(event.did);
    if (!user) {
      return;
    }
    const identity = await identityResolver.resolve(event.did);
    const saved = await userDbRepository.save(
      user.withHandle(identity?.handle ?? null),
    );
    logger.info(
      { did: saved.did, handle: saved.handle },
      "ハンドルを更新しました",
    );
  };

  const handleAccount = async ({ account }: AccountEvent) => {
    const status = toAccountStatus(account);
    await userService.updateStatus(account.did, status);
    logger.info(
      { did: account.did, status },
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
    await boardService.deleteBoard(event.did);
    logger.info({ userDid: event.did }, "ボードを削除しました");
  });

  return {
    handleCreateOrUpdate,
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
