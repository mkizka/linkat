import type { Did } from "@atproto/did";

import type { BoardCard } from "~/schemas/board";
import type { IBoardRepository } from "~/server/infrastructure/board/boardRepository";
import type { IBskyLinkPdsRepository } from "~/server/infrastructure/bskyLink/bskyLinkPdsRepository";
import type { IFaviconFetcher } from "~/server/infrastructure/favicon/faviconFetcher";

const MAX_LINKS = 10;

const hasUrl = (card: BoardCard): card is BoardCard & { url: string } =>
  !!card.url;

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
    const indexes = new Set(cardIndexes);
    if (indexes.size > MAX_LINKS) {
      throw new BskyLinkSelectionError();
    }
    const board = await boardRepository.find(editorDid);
    const cards = board?.cards.filter((_, index) => indexes.has(index)) ?? [];
    if (cards.length === 0 || cards.length !== indexes.size) {
      throw new BskyLinkSelectionError();
    }
    if (!cards.every(hasUrl)) {
      throw new BskyLinkSelectionError();
    }
    const links = await Promise.all(
      cards.map(async ({ url, text }) => ({
        url,
        title: text || undefined,
        icon: await faviconFetcher.fetchPng(url),
      })),
    );
    await bskyLinkPdsRepository.replace(editorDid, links);
  },
});
