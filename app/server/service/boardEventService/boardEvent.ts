import type { Did } from "@atproto/did";

import type { Board } from "~/models/board";
import type { IBoardPdsRepository } from "~/server/infrastructure/boardPdsRepository";
import type { IBoardRepository } from "~/server/infrastructure/boardRepository";
import type { IOwnerRepository } from "~/server/infrastructure/ownerRepository";
import type { IOwnerService } from "~/server/service/ownerService/owner";

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
  saveBoard: (board: Board) => Promise<void>;
  publishBoard: (board: Board) => Promise<void>;
  deleteBoard: (ownerDid: Did) => Promise<void>;
  unpublishBoard: (ownerDid: Did) => Promise<void>;
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
  const saveBoard = async (board: Board) => {
    await ownerService.syncOwner(board.ownerDid);
    await boardRepository.save(board);
  };
  const deleteBoard = async (ownerDid: Did) => {
    await ownerRepository.delete(ownerDid);
    await boardRepository.delete(ownerDid);
  };
  return {
    saveBoard,
    async publishBoard(board) {
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
    deleteBoard,
    async unpublishBoard(ownerDid) {
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
