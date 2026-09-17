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

export class Board {
  private constructor(readonly cards: ValidCard[]) {}

  static parse(input: unknown): Board {
    return new Board(boardSchema.parse(input).cards);
  }

  static safeParse(input: unknown): Board | null {
    const result = boardSchema.safeParse(input);
    return result.success ? new Board(result.data.cards) : null;
  }

  static fromRecordJSON(json: string): Board {
    return Board.parse(JSON.parse(json));
  }

  toRecordJSON(): string {
    return JSON.stringify(this);
  }
}
