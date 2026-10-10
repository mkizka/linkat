import { lexParse } from "@atproto/lex";

import { Board } from "~/models/board";
import type { IIngesterHandler } from "~/server/infrastructure/ingester/ingesterClient";
import type { ILogger } from "~/server/infrastructure/logger/logger";
import type { IProfileRecordParser } from "~/server/infrastructure/owner/profileRecordParser";
import type { IBoardEventService } from "~/server/service/board/boardEvent";
import type { IOwnerService } from "~/server/service/owner/owner";
import { tryCatch } from "~/utils/tryCatch";

const jsonToLex = tryCatch((json: unknown) => lexParse(JSON.stringify(json)));

const PROFILE_RKEY = "self";

export const ingesterServiceFactory = ({
  boardEventService,
  ownerService,
  profileRecordParser,
  logger,
}: {
  boardEventService: IBoardEventService;
  ownerService: IOwnerService;
  profileRecordParser: IProfileRecordParser;
  logger: ILogger;
}): IIngesterHandler => {
  const log = logger.child("ingester");

  const parseProfile = async (json: unknown) => {
    const record = await jsonToLex(json);
    return record instanceof Error ? null : profileRecordParser.parse(record);
  };

  const updateProfile = async (
    ...args: Parameters<IOwnerService["updateProfile"]>
  ) => {
    const saved = await ownerService.updateProfile(...args);
    if (saved) {
      log.debug("プロフィールを更新しました", { owner: saved });
    }
  };

  return {
    async handleBoardCommit({ did, record }) {
      const board = await tryCatch(() => Board.fromRecord(did, record))();
      if (board instanceof Error) {
        log.warn("ボードのパースに失敗しました", { record });
        return;
      }
      await boardEventService.handleBoardCommit(board);
      log.info("ボードを更新しました", {
        ownerDid: board.ownerDid,
        cardCount: board.cards.length,
      });
    },
    async handleBoardDelete({ did }) {
      await boardEventService.handleBoardDeleteCommit(did);
      log.info("ボードを削除しました", { ownerDid: did });
    },
    async handleProfileCommit({ did, rkey, record }) {
      if (rkey !== PROFILE_RKEY) {
        return;
      }
      const profile = await parseProfile(record);
      if (!profile) {
        log.warn("プロフィールのパースに失敗しました", { did, record });
        return;
      }
      await updateProfile(did, profile);
    },
    async handleProfileDelete({ did, rkey }) {
      if (rkey !== PROFILE_RKEY) {
        return;
      }
      await updateProfile(did, null);
    },
    async handleIdentity({ did }) {
      const saved = await ownerService.refreshHandle(did);
      if (saved) {
        log.info("ハンドルを更新しました", {
          did: saved.did,
          handle: saved.handle,
        });
      }
    },
    async handleAccount({ did, state }) {
      await ownerService.updateAccountState(did, state);
      log.debug("アカウントの状態を受け取りました", { did, ...state });
    },
  };
};
