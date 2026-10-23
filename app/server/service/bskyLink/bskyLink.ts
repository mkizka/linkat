import type { Did } from "@atproto/did";

import type { IBoardRepository } from "~/server/infrastructure/board/boardRepository";
import type { IBskyLinkPdsRepository } from "~/server/infrastructure/bskyLink/bskyLinkPdsRepository";
import type { IFaviconFetcher } from "~/server/infrastructure/favicon/faviconFetcher";

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
  faviconFetcher,
}: {
  boardRepository: IBoardRepository;
  bskyLinkPdsRepository: IBskyLinkPdsRepository;
  faviconFetcher: IFaviconFetcher;
}): IBskyLinkService => ({
  async exportCards(editorDid, cardIndexes) {
    const board = await boardRepository.find(editorDid);
    const indexes = new Set(cardIndexes);
    const cards = board?.cards.filter((_, index) => indexes.has(index)) ?? [];
    if (cards.length === 0 || cards.length !== indexes.size) {
      throw new BskyLinkSelectionError();
    }
    const links = await Promise.all(
      cards.map(async (card) => ({
        card,
        icon: card.url ? await faviconFetcher.fetchPng(card.url) : null,
      })),
    );
    await bskyLinkPdsRepository.replace(editorDid, links);
  },
});
