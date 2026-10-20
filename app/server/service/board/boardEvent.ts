import type { Did } from "@atproto/did";

import type { BoardDto } from "~/server/infrastructure/board/boardDto";
import type { IBoardPdsRepository } from "~/server/infrastructure/board/boardPdsRepository";
import type { IBoardRepository } from "~/server/infrastructure/board/boardRepository";
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

export class BoardDbDeleteError extends Error {
  constructor(cause: unknown) {
    super("DBからのボードの削除に失敗しました", { cause });
  }
}

export interface IBoardEventService {
  handleBoardCommit: (board: BoardDto) => Promise<void>;
  handleBoardDeleteCommit: (ownerDid: Did) => Promise<void>;
  handleEditorSave: (board: BoardDto) => Promise<void>;
  handleEditorSync: (editorDid: Did) => Promise<{ boardImported: boolean }>;
  handleEditorDelete: (ownerDid: Did) => Promise<void>;
}

export const boardEventServiceFactory = ({
  boardRepository,
  boardPdsRepository,
  ownerService,
}: {
  boardRepository: IBoardRepository;
  boardPdsRepository: IBoardPdsRepository;
  ownerService: IOwnerService;
}): IBoardEventService => {
  return {
    async handleBoardCommit(board) {
      await ownerService.syncOwner(board.ownerDid);
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
    async handleEditorSync(editorDid) {
      await ownerService.syncOwner(editorDid);
      const board = await boardPdsRepository.find(editorDid);
      if (board) {
        await boardRepository.save(board);
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
