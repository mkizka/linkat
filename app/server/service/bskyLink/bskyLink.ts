import type { Did } from "@atproto/did";

import type { BoardCard } from "~/schemas/board";
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
  exportCards: (editorDid: Did, cards: BoardCard[]) => Promise<void>;
}

export const bskyLinkServiceFactory = ({
  bskyLinkPdsRepository,
  faviconFetcher,
}: {
  bskyLinkPdsRepository: IBskyLinkPdsRepository;
  faviconFetcher: IFaviconFetcher;
}): IBskyLinkService => ({
  async exportCards(editorDid, cards) {
    if (
      cards.length === 0 ||
      cards.length > MAX_LINKS ||
      !cards.every(hasUrl)
    ) {
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
