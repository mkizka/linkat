import { db } from "~/server/infrastructure/drizzle";
import { boardTable } from "~/server/infrastructure/schema";

import { OwnerFactory } from "./owner";

export const cardsFromFactory = [
  {
    url: "https://example.com",
    text: "Factoryで作成したカード",
  },
];

export const BoardFactory = {
  create: async (overrides: Partial<typeof boardTable.$inferInsert> = {}) => {
    const ownerDid = overrides.ownerDid ?? (await OwnerFactory.create()).did;
    const [board] = await db
      .insert(boardTable)
      .values({
        record: JSON.stringify({ cards: cardsFromFactory }),
        updatedAt: new Date(),
        ...overrides,
        ownerDid,
      })
      .returning();
    if (!board) {
      throw new Error("ボードの作成に失敗しました");
    }
    return board;
  },
};
