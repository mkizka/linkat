import type { Did } from "@atproto/did";

import { bskyLinkUrlSchema, MAX_BSKY_LINKS } from "~/schemas/bskyLink";
import type { IBoardRepository } from "~/server/infrastructure/board/boardRepository";
import type { IBskyLinkPdsRepository } from "~/server/infrastructure/bskyLink/bskyLinkPdsRepository";

export class BskyLinkSelectionError extends Error {
  constructor() {
    super("書き出すカードの選択が不正です");
  }
}

export interface IBskyLinkService {
  exportCards: (editorDid: Did, cardIndexes: number[]) => Promise<void>;
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
      cards.length > MAX_BSKY_LINKS ||
      !cards.every((card) => bskyLinkUrlSchema.safeParse(card.url).success)
    ) {
      throw new BskyLinkSelectionError();
    }
    await bskyLinkPdsRepository.replace(editorDid, cards);
  },
});
