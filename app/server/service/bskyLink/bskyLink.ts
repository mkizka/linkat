import type { Did } from "@atproto/did";

import {
  isExportableCard,
  MAX_EXPORT_CARDS,
  type ValidCard,
} from "~/models/card";
import type { IBoardRepository } from "~/server/infrastructure/board/boardRepository";
import type { IBskyLinkPdsRepository } from "~/server/infrastructure/bskyLink/bskyLinkPdsRepository";

export class BskyLinkSelectionError extends Error {
  constructor() {
    super("書き出すカードの選択が不正です");
  }
}

export interface IBskyLinkService {
  exportCards: (editorDid: Did, cardIndexes: number[]) => Promise<ValidCard[]>;
}

export const bskyLinkServiceFactory = ({
  boardRepository,
  bskyLinkPdsRepository,
}: {
  boardRepository: IBoardRepository;
  bskyLinkPdsRepository: IBskyLinkPdsRepository;
}): IBskyLinkService => ({
  async exportCards(editorDid, cardIndexes) {
    const board = await boardRepository.find(editorDid);
    const indexes = new Set(cardIndexes);
    const cards = board?.cards.filter((_, index) => indexes.has(index)) ?? [];
    if (
      cards.length === 0 ||
      cards.length !== indexes.size ||
      cards.length > MAX_EXPORT_CARDS ||
      !cards.every(isExportableCard)
    ) {
      throw new BskyLinkSelectionError();
    }
    await bskyLinkPdsRepository.replace(editorDid, cards);
    return cards;
  },
});
