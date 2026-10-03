import type { Did } from "@atproto/did";

import type { LinkatAgent } from "~/libs/agent";
import { Board } from "~/models/board";
import type { User } from "~/models/user";
import type { IBoardRepository } from "~/server/infrastructure/boardRepository";
import type { IUserRepository } from "~/server/infrastructure/userRepository";
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
  saveBoard: (board: Board) => Promise<User | null>;
  publishBoard: (agent: LinkatAgent, board: Board) => Promise<User | null>;
  findBoard: (userDid: Did) => Promise<Board | null>;
  deleteBoard: (userDid: Did) => Promise<void>;
  unpublishBoard: (agent: LinkatAgent, userDid: Did) => Promise<void>;
}

export const boardServiceFactory = ({
  boardRepository,
  userRepository,
}: {
  boardRepository: IBoardRepository;
  userRepository: IUserRepository;
}): IBoardService => {
  const saveBoard = async (board: Board) => {
    const owner = await userRepository.refresh(board.userDid);
    if (!owner) {
      return null;
    }
    await boardRepository.save(board);
    return owner;
  };

  return {
    parseBoardFromForm: tryCatch(
      (userDid: Did, rawBoard: string) =>
        new Board(userDid, Board.parseCards(JSON.parse(rawBoard))),
    ),
    saveBoard,
    async publishBoard(agent, board) {
      try {
        await agent.updateBoard(board);
      } catch (error) {
        throw new BoardPdsSaveError(error);
      }
      try {
        return await saveBoard(board);
      } catch (error) {
        throw new BoardDbSaveError(error);
      }
    },
    async findBoard(userDid) {
      return await boardRepository.find(userDid);
    },
    async deleteBoard(userDid) {
      await boardRepository.delete(userDid);
    },
    async unpublishBoard(agent, userDid) {
      try {
        await agent.deleteBoard();
      } catch (error) {
        throw new BoardPdsDeleteError(error);
      }
      try {
        await boardRepository.delete(userDid);
      } catch (error) {
        throw new BoardDbDeleteError(error);
      }
    },
  };
};
