import { type Did, isDid } from "@atproto/did";

import type { BoardDto } from "~/server/infrastructure/board/boardDto";
import type { IBoardRepository } from "~/server/infrastructure/board/boardRepository";
import type { ModerationLevelDto } from "~/server/infrastructure/moderation/moderationDto";
import type { IModerationRepository } from "~/server/infrastructure/moderation/moderationRepository";
import type { IHandleIndex } from "~/server/infrastructure/owner/handleIndex";
import type { IOwnerRepository } from "~/server/infrastructure/owner/ownerRepository";
import type { IModerationService } from "~/server/service/moderation/moderation";
import type {
  IOwnerViewService,
  OwnerView,
} from "~/server/service/owner/ownerView";

export type BoardView =
  | { type: "not-found" }
  | { type: "hidden"; status: string | null }
  | {
      type: "ok";
      owner: OwnerView;
      board: BoardDto;
      admin: { moderationLevel: ModerationLevelDto } | null;
    };

export interface IBoardService {
  findBoard: (ownerDid: Did) => Promise<BoardDto | null>;
  findBoardView: (
    handleOrDid: string,
    viewerDid: Did | null,
  ) => Promise<BoardView>;
}

export const boardServiceFactory = ({
  boardRepository,
  handleIndex,
  ownerRepository,
  ownerViewService,
  moderationRepository,
  moderationService,
}: {
  boardRepository: IBoardRepository;
  handleIndex: IHandleIndex;
  ownerRepository: IOwnerRepository;
  ownerViewService: IOwnerViewService;
  moderationRepository: IModerationRepository;
  moderationService: IModerationService;
}): IBoardService => ({
  async findBoard(ownerDid) {
    return await boardRepository.find(ownerDid);
  },
  async findBoardView(handleOrDid, viewerDid) {
    const did = isDid(handleOrDid)
      ? handleOrDid
      : await handleIndex.findDid(handleOrDid);
    if (!did) {
      return { type: "not-found" };
    }
    const isMine = did === viewerDid;
    const owner = await ownerRepository.findByDid(did);
    if (owner && !owner.active && !isMine) {
      return { type: "hidden", status: owner.status };
    }
    const level = await moderationRepository.findLevel(did);
    const isAdmin = moderationService.isAdmin(viewerDid);
    if (level === "hidden" && !isAdmin && !isMine) {
      return { type: "hidden", status: null };
    }
    const board = await boardRepository.find(did);
    if (!board) {
      return { type: "not-found" };
    }
    return {
      type: "ok",
      owner: ownerViewService.toOwnerView(did, owner),
      board,
      admin: isAdmin ? { moderationLevel: level } : null,
    };
  },
});
