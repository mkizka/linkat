import type { Did } from "@atproto/did";

import type { LinkatAgent } from "~/libs/agent";
import { Board } from "~/models/board";
import type { IBoardRepository } from "~/server/infrastructure/boardRepository";
import type { IUserDbRepository } from "~/server/infrastructure/userDbRepository";
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
    userDid: Did,
    rawBoard: string,
  ) => Promise<Board | Error>;
  saveBoard: (board: Board) => Promise<void>;
  publishBoard: (agent: LinkatAgent, board: Board) => Promise<void>;
  findBoard: (userDid: Did) => Promise<Board | null>;
  deleteBoard: (userDid: Did) => Promise<void>;
  unpublishBoard: (agent: LinkatAgent, userDid: Did) => Promise<void>;
}

export const boardServiceFactory = ({
  boardRepository,
  userDbRepository,
}: {
  boardRepository: IBoardRepository;
  userDbRepository: IUserDbRepository;
}): IBoardService => {
  const deleteBoard = async (userDid: Did) => {
    await userDbRepository.delete(userDid);
    await boardRepository.delete(userDid);
  };
  return {
    parseBoardFromForm: tryCatch(
      (userDid: Did, rawBoard: string) =>
        new Board(userDid, Board.parseCards(JSON.parse(rawBoard))),
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
    async findBoard(userDid) {
      return await boardRepository.find(userDid);
    },
    deleteBoard,
    async unpublishBoard(agent, userDid) {
      try {
        await agent.deleteBoard();
      } catch (error) {
        throw new BoardPdsDeleteError(error);
      }
      try {
        await deleteBoard(userDid);
      } catch (error) {
        throw new BoardDbDeleteError(error);
      }
    },
  };
};
