import type { Did } from "@atproto/did";

import { Board } from "~/models/board";
import type { OwnerView } from "~/models/owner";
import type { IBoardRepository } from "~/server/infrastructure/boardRepository";
import type { IOwnerService } from "~/server/service/ownerService/owner";
import { tryCatch } from "~/utils/tryCatch";

export type BoardView =
  | { type: "not-found" }
  | { type: "hidden"; status: string | null }
  | { type: "ok"; owner: OwnerView; board: Board };

export interface IBoardService {
  parseBoardFromForm: (
    ownerDid: Did,
    rawBoard: string,
  ) => Promise<Board | Error>;
  findBoard: (ownerDid: Did) => Promise<Board | null>;
  findBoardView: (handleOrDid: string) => Promise<BoardView>;
}

export const boardServiceFactory = ({
  boardRepository,
  ownerService,
}: {
  boardRepository: IBoardRepository;
  ownerService: IOwnerService;
}): IBoardService => ({
  parseBoardFromForm: tryCatch(
    (ownerDid: Did, rawBoard: string) =>
      new Board(ownerDid, Board.parseCards(JSON.parse(rawBoard))),
  ),
  async findBoard(ownerDid) {
    return await boardRepository.find(ownerDid);
  },
  async findBoardView(handleOrDid) {
    const owner = await ownerService.findOwner({ handleOrDid });
    if (!owner) {
      return { type: "not-found" };
    }
    if (owner.isHidden()) {
      return { type: "hidden", status: owner.status };
    }
    const board = await boardRepository.find(owner.did);
    if (!board) {
      return { type: "not-found" };
    }
    return { type: "ok", owner: owner.toView(), board };
  },
});
