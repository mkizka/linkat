import type { Did } from "@atproto/did";
import { eq } from "drizzle-orm";

import { type BoardCard, boardSchema } from "~/schemas/board";
import type { Db } from "~/server/infrastructure/db/drizzle";
import { boardTable } from "~/server/infrastructure/db/schema";

export type Board = {
  ownerDid: Did;
  cards: BoardCard[];
};

export interface IBoardRepository {
  find: (ownerDid: Did) => Promise<Board | null>;
  save: (board: Board) => Promise<void>;
  delete: (ownerDid: Did) => Promise<void>;
}

export const boardRepositoryFactory = ({
  db,
}: {
  db: Db;
}): IBoardRepository => ({
  async find(ownerDid) {
    const [row] = await db
      .select()
      .from(boardTable)
      .where(eq(boardTable.ownerDid, ownerDid));
    if (!row) {
      return null;
    }
    return {
      ownerDid,
      cards: boardSchema.parse(JSON.parse(row.record)).cards,
    };
  },
  async save(board) {
    const data = {
      ownerDid: board.ownerDid,
      record: JSON.stringify({ cards: board.cards }),
      updatedAt: new Date(),
    };
    await db
      .insert(boardTable)
      .values(data)
      .onConflictDoUpdate({ target: boardTable.ownerDid, set: data });
  },
  async delete(ownerDid) {
    await db.delete(boardTable).where(eq(boardTable.ownerDid, ownerDid));
  },
});
