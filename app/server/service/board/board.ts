import { type Did, isDid } from "@atproto/did";

import type { Board } from "~/models/board";
import type { OwnerView } from "~/models/owner";
import type { IBoardRepository } from "~/server/infrastructure/board/boardRepository";
import type { IHandleIndex } from "~/server/infrastructure/owner/handleIndex";
import type { IOwnerService } from "~/server/service/owner/owner";

export type BoardView =
  | { type: "not-found" }
  | { type: "hidden"; status: string | null }
  | { type: "ok"; owner: OwnerView; board: Board };

export interface IBoardService {
  findBoard: (ownerDid: Did) => Promise<Board | null>;
  findBoardView: (handleOrDid: string) => Promise<BoardView>;
}

export const boardServiceFactory = ({
  boardRepository,
  handleIndex,
  ownerService,
}: {
  boardRepository: IBoardRepository;
  handleIndex: IHandleIndex;
  ownerService: IOwnerService;
}): IBoardService => ({
  async findBoard(ownerDid) {
    return await boardRepository.find(ownerDid);
  },
  async findBoardView(handleOrDid) {
    const did = isDid(handleOrDid)
      ? handleOrDid
      : await handleIndex.findDid(handleOrDid);
    if (!did) {
      return { type: "not-found" };
    }
    const owner = await ownerService.findOwner(did);
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
