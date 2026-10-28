import { boardSchema } from "~/schemas/board";
import type { IIngesterHandler } from "~/server/infrastructure/ingester/ingesterClient";
import type { ILogger } from "~/server/infrastructure/logger/logger";
import type { IOwnerRepository } from "~/server/infrastructure/owner/ownerRepository";
import type { IProfileRecordParser } from "~/server/infrastructure/owner/profileRecordParser";
import {
  BoardPdsFetchError,
  type IBoardEventService,
} from "~/server/service/board/boardEvent";
import type { IOwnerService } from "~/server/service/owner/owner";

const PROFILE_RKEY = "self";

export const ingesterServiceFactory = ({
  boardEventService,
  ownerService,
  ownerRepository,
  profileRecordParser,
  logger,
}: {
  boardEventService: IBoardEventService;
  ownerService: IOwnerService;
  ownerRepository: IOwnerRepository;
  profileRecordParser: IProfileRecordParser;
  logger: ILogger;
}): IIngesterHandler => {
  const log = logger.child("ingester");

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
      const board = { ownerDid: did, cards: boardSchema.parse(record).cards };
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
      const profile = profileRecordParser.parse(record);
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
    async handleSync({ did }) {
      if (!(await ownerRepository.findByDid(did))) {
        return;
      }
      try {
        const { boardImported } = await boardEventService.handleSync(did);
        log.info("PDSから持ち主とボードを同期し直しました", {
          ownerDid: did,
          boardImported,
        });
      } catch (error) {
        if (!(error instanceof BoardPdsFetchError)) {
          throw error;
        }
        log.warn("PDSからのボードの取得に失敗しました", {
          ownerDid: did,
          error,
        });
      }
    },
  };
};
