import type { Did } from "@atproto/did";

import link from "~/generated/app/bsky/actor/link";
import type { BoardCard } from "~/schemas/board";
import type { IBoardRepository } from "~/server/infrastructure/board/boardRepository";
import type { IBskyLinkPdsRepository } from "~/server/infrastructure/bskyLink/bskyLinkPdsRepository";
import type { IFaviconFetcher } from "~/server/infrastructure/favicon/faviconFetcher";

const MAX_LINKS = 10;

const toLinkRecord = ({ url, text }: BoardCard) => {
  const result = link.safeParse({
    $type: link.$type,
    url,
    title: text || undefined,
    createdAt: new Date().toISOString(),
  });
  return result.success ? [result.value] : [];
};

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
    const records = cards.flatMap(toLinkRecord);
    if (
      records.length === 0 ||
      records.length !== indexes.size ||
      records.length > MAX_LINKS
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
