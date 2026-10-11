import type { Did } from "@atproto/did";

import type { IBoardRepository } from "~/server/infrastructure/board/boardRepository";
import type { IFollowFetcher } from "~/server/infrastructure/follow/followFetcher";
import type { IOwnerRepository } from "~/server/infrastructure/owner/ownerRepository";
import type {
  IOwnerViewService,
  OwnerView,
} from "~/server/service/owner/ownerView";

export type FollowingBoard = {
  owner: OwnerView;
  updatedAt: Date;
};

export interface IFollowingService {
  findFollowingBoards: (params: {
    editorDid: Did;
    limit?: number;
  }) => Promise<FollowingBoard[] | Error>;
}

export const followingServiceFactory = ({
  boardRepository,
  followFetcher,
  ownerRepository,
  ownerViewService,
}: {
  boardRepository: IBoardRepository;
  followFetcher: IFollowFetcher;
  ownerRepository: IOwnerRepository;
  ownerViewService: IOwnerViewService;
}): IFollowingService => ({
  async findFollowingBoards({ editorDid, limit }) {
    const followDids = await followFetcher.fetchFollowDids(editorDid);
    if (followDids instanceof Error) {
      return followDids;
    }
    const boards = await boardRepository.findRecentlyUpdated({
      ownerDids: followDids,
      limit,
    });
    const owners = new Map(
      (
        await ownerRepository.findByDids(boards.map((board) => board.ownerDid))
      ).map((owner) => [owner.did, owner]),
    );
    return boards.map(({ ownerDid, updatedAt }) => ({
      owner: ownerViewService.toOwnerView(
        ownerDid,
        owners.get(ownerDid) ?? null,
      ),
      updatedAt,
    }));
  },
});
