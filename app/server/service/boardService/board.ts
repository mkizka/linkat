import type { Did } from "@atproto/did";

import { Board } from "~/models/board";
import type { IBoardRepository } from "~/server/infrastructure/boardRepository";
import { tryCatch } from "~/utils/tryCatch";

export interface IBoardService {
  parseBoardFromForm: (
    userDid: Did,
    rawBoard: string,
  ) => Promise<Board | Error>;
  saveBoard: (board: Board) => Promise<void>;
  findBoard: (userDid: Did) => Promise<Board | null>;
  deleteBoard: (userDid: Did) => Promise<void>;
}

export const boardServiceFactory = ({
  boardRepository,
}: {
  boardRepository: IBoardRepository;
}): IBoardService => {
  return {
    parseBoardFromForm: tryCatch(
      (userDid: Did, rawBoard: string) =>
        new Board(userDid, Board.parseCards(JSON.parse(rawBoard))),
    ),
    async saveBoard(board) {
      await boardRepository.save(board);
    },
    async findBoard(userDid) {
      return await boardRepository.find(userDid);
    },
    async deleteBoard(userDid) {
      await boardRepository.delete(userDid);
    },
  };
};
