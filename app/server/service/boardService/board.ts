import type { Did } from "@atproto/did";

import { Board } from "~/models/board";
import type { IBoardRepository } from "~/server/infrastructure/boardRepository";
import { tryCatch } from "~/utils/tryCatch";

export interface IBoardService {
  parseBoardFromForm: (
    ownerDid: Did,
    rawBoard: string,
  ) => Promise<Board | Error>;
  findBoard: (ownerDid: Did) => Promise<Board | null>;
}

export const boardServiceFactory = ({
  boardRepository,
}: {
  boardRepository: IBoardRepository;
}): IBoardService => ({
  parseBoardFromForm: tryCatch(
    (ownerDid: Did, rawBoard: string) =>
      new Board(ownerDid, Board.parseCards(JSON.parse(rawBoard))),
  ),
  async findBoard(ownerDid) {
    return await boardRepository.find(ownerDid);
  },
});
