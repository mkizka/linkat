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
  private constructor(
    readonly userDid: string,
    readonly cards: ValidCard[],
  ) {}

  static parseCards(input: unknown): ValidCard[] {
    const result = boardSchema.safeParse(input);
    if (!result.success) {
      throw new BoardParseError(result.error);
    }
    return result.data.cards;
  }

  static of(userDid: string, cards: ValidCard[]): Board {
    return new Board(userDid, cards);
  }

  toRecordJSON(): string {
    return JSON.stringify({ cards: this.cards });
  }
}
