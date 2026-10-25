import type { Did } from "@atproto/did";

import type { BoardDto } from "~/server/infrastructure/board/boardDto";
import type { IBoardPdsRepository } from "~/server/infrastructure/board/boardPdsRepository";
import type { IBoardRepository } from "~/server/infrastructure/board/boardRepository";
import type { IIdentityResolver } from "~/server/infrastructure/owner/identityResolver";
import type { IOwnerService } from "~/server/service/owner/owner";

export class BoardPdsSaveError extends Error {
  constructor(cause: unknown) {
    super("PDSへのボードの保存に失敗しました", { cause });
  }
}

export class BoardDbSaveError extends Error {
  constructor(cause: unknown) {
    super("DBへのボードの保存に失敗しました", { cause });
  }
}

export class BoardPdsDeleteError extends Error {
  constructor(cause: unknown) {
    super("PDSからのボードの削除に失敗しました", { cause });
  }
}

export class BoardPdsFetchError extends Error {
  constructor(cause: unknown) {
    super("PDSからのボードの取得に失敗しました", { cause });
  }
}

export class BoardDbDeleteError extends Error {
  constructor(cause: unknown) {
    super("DBからのボードの削除に失敗しました", { cause });
  }
}

export interface IBoardEventService {
  handleBoardCommit: (board: BoardDto) => Promise<void>;
  handleBoardDeleteCommit: (ownerDid: Did) => Promise<void>;
  handleEditorSave: (board: BoardDto) => Promise<void>;
  handleSync: (did: Did) => Promise<{ boardImported: boolean }>;
  handleEditorDelete: (ownerDid: Did) => Promise<void>;
}

export const boardEventServiceFactory = ({
  boardRepository,
  boardPdsRepository,
  ownerService,
  identityResolver,
}: {
  boardRepository: IBoardRepository;
  boardPdsRepository: IBoardPdsRepository;
  ownerService: IOwnerService;
  identityResolver: IIdentityResolver;
}): IBoardEventService => {
  return {
    async handleBoardCommit(board) {
      const identity = await identityResolver.resolve(board.ownerDid);
      await ownerService.syncOwner(board.ownerDid, identity);
      await boardRepository.save(board);
    },
    async handleEditorSave(board) {
      try {
        await boardPdsRepository.save(board);
      } catch (error) {
        throw new BoardPdsSaveError(error);
      }
      try {
        await boardRepository.save(board);
      } catch (error) {
        throw new BoardDbSaveError(error);
      }
    },
    async handleSync(editorDid) {
      // PDSの移行直後でも新しいPDSを見るように、キャッシュを使わずに1回だけ解決する
      const identity = await identityResolver.resolve(editorDid, {
        fresh: true,
      });
      await ownerService.syncOwner(editorDid, identity);
      if (!identity) {
        throw new Error("DIDを解決できませんでした");
      }
      let board;
      try {
        board = await boardPdsRepository.find(editorDid, identity.pds);
      } catch (error) {
        throw new BoardPdsFetchError(error);
      }
      if (board) {
        await boardRepository.save(board);
      } else {
        await boardRepository.delete(editorDid);
      }
      return { boardImported: !!board };
    },
    async handleBoardDeleteCommit(ownerDid) {
      await boardRepository.delete(ownerDid);
    },
    async handleEditorDelete(ownerDid) {
      try {
        await boardPdsRepository.delete(ownerDid);
      } catch (error) {
        throw new BoardPdsDeleteError(error);
      }
      try {
        await boardRepository.delete(ownerDid);
      } catch (error) {
        throw new BoardDbDeleteError(error);
      }
    },
  };
};
