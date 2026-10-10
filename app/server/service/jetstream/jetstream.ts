import { lexParse } from "@atproto/lex";

import { Board } from "~/models/board";
import type { IJetstreamHandler } from "~/server/infrastructure/jetstream/jetstreamClient";
import type { ILogger } from "~/server/infrastructure/logger/logger";
import type { IProfileRecordParser } from "~/server/infrastructure/owner/profileRecordParser";
import type { IBoardEventService } from "~/server/service/board/boardEvent";
import type { IOwnerService } from "~/server/service/owner/owner";
import { tryCatch } from "~/utils/tryCatch";

const jsonToLex = tryCatch((json: unknown) => lexParse(JSON.stringify(json)));

export const jetstreamServiceFactory = ({
  boardEventService,
  ownerService,
  profileRecordParser,
  logger,
}: {
  boardEventService: IBoardEventService;
  ownerService: IOwnerService;
  profileRecordParser: IProfileRecordParser;
  logger: ILogger;
}): IJetstreamHandler => {
  const log = logger.child("jetstream");

  const parseProfile = async (json: unknown) => {
    const record = await jsonToLex(json);
    return record instanceof Error ? null : profileRecordParser.parse(record);
  };

  return {
    async handleCreateOrUpdate(event) {
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
      log.debug("ボードを更新しました", { board });
    },
    async handleBoardDelete(event) {
      await boardEventService.handleBoardDeleteCommit(event.did);
      log.info("ボードを削除しました", { ownerDid: event.did });
    },
    async handleProfileCommit(event) {
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
    },
    async handleIdentity(event) {
      const saved = await ownerService.refreshHandle(event.did);
      if (saved) {
        log.info("ハンドルを更新しました", {
          did: saved.did,
          handle: saved.handle,
        });
      }
    },
    async handleAccount({ account }) {
      const state = { active: account.active, status: account.status ?? null };
      await ownerService.updateAccountState(account.did, state);
      log.debug("アカウントの状態を受け取りました", {
        did: account.did,
        ...state,
      });
    },
  };
};
