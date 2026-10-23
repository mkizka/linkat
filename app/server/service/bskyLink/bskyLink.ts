import type { Did } from "@atproto/did";

import { MAX_BSKY_LINKS, toBskyLink } from "~/schemas/bskyLink";
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
    const records = cards.flatMap((card) => toBskyLink(card) ?? []);
    if (
      records.length === 0 ||
      records.length !== indexes.size ||
      records.length > MAX_BSKY_LINKS
    ) {
      throw new BskyLinkSelectionError();
    }
    const links = await Promise.all(
      records.map(async (record) => ({
        record,
        icon: await faviconFetcher.fetchPng(record.url),
      })),
    );
    await bskyLinkPdsRepository.replace(editorDid, links);
  },
});
