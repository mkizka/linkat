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
  readonly userDid: Did;
  readonly cards: ValidCard[];

  constructor(userDid: string, cards: ValidCard[]) {
    this.userDid = asDid(userDid);
    this.cards = cards;
  }

  static parseCards(input: unknown): ValidCard[] {
    const result = boardSchema.safeParse(input);
    if (!result.success) {
      throw new BoardParseError(result.error);
    }
    return result.data.cards;
  }

  toRecordJSON(): string {
    return JSON.stringify({ cards: this.cards });
  }
}
