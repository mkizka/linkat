import type { Did } from "@atproto/did";

import type { Board } from "~/models/board";
import type { IBoardPdsRepository } from "~/server/infrastructure/board/boardPdsRepository";
import type { IBoardRepository } from "~/server/infrastructure/board/boardRepository";
import type { IOwnerRepository } from "~/server/infrastructure/owner/ownerRepository";
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
  handleBoardCommit: (board: Board) => Promise<void>;
  handleBoardDeleteCommit: (ownerDid: Did) => Promise<void>;
  handleEditorSave: (board: Board) => Promise<void>;
  handleEditorSync: (editorDid: Did) => Promise<{ boardImported: boolean }>;
  handleEditorDelete: (ownerDid: Did) => Promise<void>;
}

export const boardEventServiceFactory = ({
  boardRepository,
  boardPdsRepository,
  ownerRepository,
  ownerService,
}: {
  boardRepository: IBoardRepository;
  boardPdsRepository: IBoardPdsRepository;
  ownerRepository: IOwnerRepository;
  ownerService: IOwnerService;
}): IBoardEventService => {
  const deleteBoard = async (ownerDid: Did) => {
    await ownerRepository.delete(ownerDid);
    await boardRepository.delete(ownerDid);
  };
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
    handleBoardDeleteCommit: deleteBoard,
    async handleEditorDelete(ownerDid) {
      try {
        await boardPdsRepository.delete(ownerDid);
      } catch (error) {
        throw new BoardPdsDeleteError(error);
      }
      try {
        await deleteBoard(ownerDid);
      } catch (error) {
        throw new BoardDbDeleteError(error);
      }
    },
  };
};
