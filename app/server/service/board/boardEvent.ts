import type { Did } from "@atproto/did";

import type { BoardCard } from "~/schemas/board";
import type { BoardDto } from "~/server/infrastructure/board/boardDto";
import type { IBoardPdsRepository } from "~/server/infrastructure/board/boardPdsRepository";
import type { IBoardRepository } from "~/server/infrastructure/board/boardRepository";
import type { ILogger } from "~/server/infrastructure/logger/logger";
import type { IOwnerRepository } from "~/server/infrastructure/owner/ownerRepository";
import type { EditorView, IOwnerService } from "~/server/service/owner/owner";

export type EditorSaveResult =
  | { type: "not-synced" }
  | { type: "pds-failed" }
  | { type: "db-failed"; editor: EditorView }
  | { type: "saved"; editor: EditorView };

export type EditorDeleteResult =
  { type: "pds-failed" } | { type: "db-failed" } | { type: "deleted" };

export interface IBoardEventService {
  handleBoardCommit: (board: BoardDto) => Promise<void>;
  handleBoardDeleteCommit: (ownerDid: Did) => Promise<void>;
  handleEditorSave: (
    editorDid: Did,
    cards: BoardCard[],
  ) => Promise<EditorSaveResult>;
  handleEditorSync: (editorDid: Did) => Promise<{ boardImported: boolean }>;
  handleEditorDelete: (ownerDid: Did) => Promise<EditorDeleteResult>;
}

export const boardEventServiceFactory = ({
  boardRepository,
  boardPdsRepository,
  ownerRepository,
  ownerService,
  logger,
}: {
  boardRepository: IBoardRepository;
  boardPdsRepository: IBoardPdsRepository;
  ownerRepository: IOwnerRepository;
  ownerService: IOwnerService;
  logger: ILogger;
}): IBoardEventService => {
  const log = logger.child("boardEventService");
  const deleteBoard = async (ownerDid: Did) => {
    await ownerRepository.delete(ownerDid);
    await boardRepository.delete(ownerDid);
  };
  return {
    async handleBoardCommit(board) {
      await ownerService.syncOwner(board.ownerDid);
      await boardRepository.save(board);
    },
    async handleEditorSave(editorDid, cards) {
      const editor = await ownerService.findEditorView(editorDid);
      if (!editor.synced) {
        return { type: "not-synced" };
      }
      const board = { ownerDid: editorDid, cards };
      try {
        await boardPdsRepository.save(board);
      } catch (error) {
        log.error("PDSへのボードの保存に失敗しました", { error });
        return { type: "pds-failed" };
      }
      try {
        await boardRepository.save(board);
      } catch (error) {
        log.error("DBへのボードの保存に失敗しました", { error });
        return { type: "db-failed", editor };
      }
      log.info("ボードを保存しました", {
        ownerDid: editorDid,
        cardCount: cards.length,
      });
      return { type: "saved", editor };
    },
    async handleEditorSync(editorDid) {
      await ownerService.syncOwner(editorDid);
      const board = await boardPdsRepository.find(editorDid);
      if (board) {
        await boardRepository.save(board);
      }
      return { boardImported: !!board };
    },
    handleBoardDeleteCommit: deleteBoard,
    async handleEditorDelete(ownerDid) {
      try {
        await boardPdsRepository.delete(ownerDid);
      } catch (error) {
        log.error("PDSからのボードの削除に失敗しました", { error });
        return { type: "pds-failed" };
      }
      try {
        await deleteBoard(ownerDid);
      } catch (error) {
        log.error("DBからのボードの削除に失敗しました", { error });
        return { type: "db-failed" };
      }
      log.info("ボードを削除しました", { ownerDid });
      return { type: "deleted" };
    },
  };
};
