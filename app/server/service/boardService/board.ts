import type { Did } from "@atproto/did";

import type { Board } from "~/models/board";
import type { IBoardRepository } from "~/server/infrastructure/boardRepository";

export interface IBoardService {
  findBoard: (ownerDid: Did) => Promise<Board | null>;
}

export const boardServiceFactory = ({
  boardRepository,
}: {
  boardRepository: IBoardRepository;
}): IBoardService => ({
  async findBoard(ownerDid) {
    return await boardRepository.find(ownerDid);
  },
});
