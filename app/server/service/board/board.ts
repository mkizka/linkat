import { type Did, isDid } from "@atproto/did";

import type { Board } from "~/models/board";
import type { IBoardRepository } from "~/server/infrastructure/board/boardRepository";
import type { IHandleIndex } from "~/server/infrastructure/owner/handleIndex";
import type { IOwnerRepository } from "~/server/infrastructure/owner/ownerRepository";
import type {
  IOwnerViewService,
  OwnerView,
} from "~/server/service/owner/ownerView";

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
  ownerRepository,
  ownerViewService,
}: {
  boardRepository: IBoardRepository;
  handleIndex: IHandleIndex;
  ownerRepository: IOwnerRepository;
  ownerViewService: IOwnerViewService;
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
    const owner = await ownerRepository.findByDid(did);
    if (owner?.isHidden()) {
      return { type: "hidden", status: owner.status };
    }
    const board = await boardRepository.find(did);
    if (!board) {
      return { type: "not-found" };
    }
    return {
      type: "ok",
      owner: ownerViewService.toOwnerView(did, owner),
      board,
    };
  },
});
