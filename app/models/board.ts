import { asDid, type Did } from "@atproto/did";
import { z } from "zod";

import { cardSchema, type ValidCard } from "./card";

const boardSchema = z.object({
  cards: z
    .unknown()
    .array()
    .transform((val) =>
      // パースが通るならパース結果、そうでなければフィルタする
      val.flatMap((card) => {
        try {
          return cardSchema.parse(card);
        } catch {
          return [];
        }
      }),
    ),
});

export class BoardParseError extends Error {
  constructor(cause: unknown) {
    super("Boardのパースに失敗しました", { cause });
  }
}

export class Board {
  readonly ownerDid: Did;
  readonly cards: ValidCard[];

  constructor(ownerDid: string, cards: ValidCard[]) {
    this.ownerDid = asDid(ownerDid);
    this.cards = cards;
  }

  static fromRecord(ownerDid: string, input: unknown): Board {
    const result = boardSchema.safeParse(input);
    if (!result.success) {
      throw new BoardParseError(result.error);
    }
    return new Board(ownerDid, result.data.cards);
  }

  toRecordJSON(): string {
    return JSON.stringify({ cards: this.cards });
  }
}
