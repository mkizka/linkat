import type { Did } from "@atproto/did";

import type { IBoardRepository } from "~/server/infrastructure/board/boardRepository";
import type { IBskyLinkPdsRepository } from "~/server/infrastructure/bskyLink/bskyLinkPdsRepository";
import type { IFaviconFetcher } from "~/server/infrastructure/favicon/faviconFetcher";

const MAX_LINKS = 10;

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
    const links = cards.flatMap(({ url, text }) =>
      url ? [{ url, title: text || undefined }] : [],
    );
    if (
      links.length === 0 ||
      links.length !== indexes.size ||
      links.length > MAX_LINKS
    ) {
      throw new BskyLinkSelectionError();
    }
    await bskyLinkPdsRepository.replace(
      editorDid,
      await Promise.all(
        links.map(async (link) => ({
          ...link,
          icon: await faviconFetcher.fetchPng(link.url),
        })),
      ),
    );
  },
});
