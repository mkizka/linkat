import { db } from "~/server/infrastructure/drizzle";
import { boardTable } from "~/server/infrastructure/schema";

import { UserFactory } from "./user";

export const cardsFromFactory = [
  {
    url: "https://example.com",
    text: "Factoryで作成したカード",
  },
];

export const BoardFactory = {
  create: async (overrides: Partial<typeof boardTable.$inferInsert> = {}) => {
    const userDid = overrides.userDid ?? (await UserFactory.create()).did;
    const [board] = await db
      .insert(boardTable)
      .values({
        record: JSON.stringify({ cards: cardsFromFactory }),
        updatedAt: new Date(),
        ...overrides,
        userDid,
      })
      .returning();
    if (!board) {
      throw new Error("ボードの作成に失敗しました");
    }
    return board;
  },
};
