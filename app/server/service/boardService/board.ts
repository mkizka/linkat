import type { Did } from "@atproto/did";

import type { LinkatAgent } from "~/libs/agent";
import { Board } from "~/models/board";
import type { IBoardRepository } from "~/server/infrastructure/boardRepository";
import type { IOwnerDbRepository } from "~/server/infrastructure/ownerDbRepository";
import { tryCatch } from "~/utils/tryCatch";

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

export interface IBoardService {
  parseBoardFromForm: (
    ownerDid: Did,
    rawBoard: string,
  ) => Promise<Board | Error>;
  saveBoard: (board: Board) => Promise<void>;
  publishBoard: (agent: LinkatAgent, board: Board) => Promise<void>;
  findBoard: (ownerDid: Did) => Promise<Board | null>;
  deleteBoard: (ownerDid: Did) => Promise<void>;
  unpublishBoard: (agent: LinkatAgent, ownerDid: Did) => Promise<void>;
}

export const boardServiceFactory = ({
  boardRepository,
  ownerDbRepository,
}: {
  boardRepository: IBoardRepository;
  ownerDbRepository: IOwnerDbRepository;
}): IBoardService => {
  const deleteBoard = async (ownerDid: Did) => {
    await ownerDbRepository.delete(ownerDid);
    await boardRepository.delete(ownerDid);
  };
  return {
    parseBoardFromForm: tryCatch(
      (ownerDid: Did, rawBoard: string) =>
        new Board(ownerDid, Board.parseCards(JSON.parse(rawBoard))),
    ),
    async saveBoard(board) {
      await boardRepository.save(board);
    },
    async publishBoard(agent, board) {
      try {
        await agent.updateBoard(board);
      } catch (error) {
        throw new BoardPdsSaveError(error);
      }
      try {
        await boardRepository.save(board);
      } catch (error) {
        throw new BoardDbSaveError(error);
      }
    },
    async findBoard(ownerDid) {
      return await boardRepository.find(ownerDid);
    },
    deleteBoard,
    async unpublishBoard(agent, ownerDid) {
      try {
        await agent.deleteBoard();
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
