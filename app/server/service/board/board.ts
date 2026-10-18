import { type Did, isDid } from "@atproto/did";

import type { BoardDto } from "~/server/infrastructure/board/boardDto";
import type { IBoardRepository } from "~/server/infrastructure/board/boardRepository";
import type { IHandleIndex } from "~/server/infrastructure/owner/handleIndex";
import type { IOwnerRepository } from "~/server/infrastructure/owner/ownerRepository";
import type { IRecentOwnersQuery } from "~/server/infrastructure/query/recentOwnersQuery";
import type {
  IOwnerViewService,
  OwnerView,
} from "~/server/service/owner/ownerView";

export type BoardView =
  | { type: "not-found" }
  | { type: "hidden"; status: string | null }
  | { type: "ok"; owner: OwnerView; board: BoardDto };

export interface IBoardService {
  findBoard: (ownerDid: Did) => Promise<BoardDto | null>;
  findBoardView: (handleOrDid: string) => Promise<BoardView>;
  findRecentOwnerViews: (
    limit: number,
    excludeDid?: Did,
  ) => Promise<OwnerView[]>;
}

export const boardServiceFactory = ({
  boardRepository,
  handleIndex,
  ownerRepository,
  ownerViewService,
  recentOwnersQuery,
}: {
  boardRepository: IBoardRepository;
  handleIndex: IHandleIndex;
  ownerRepository: IOwnerRepository;
  ownerViewService: IOwnerViewService;
  recentOwnersQuery: IRecentOwnersQuery;
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
    if (owner && !owner.active) {
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
  async findRecentOwnerViews(limit, excludeDid) {
    const owners = await recentOwnersQuery.find(limit, excludeDid);
    return owners.map(({ ownerDid, owner }) =>
      ownerViewService.toOwnerView(ownerDid, owner),
    );
  },
});
