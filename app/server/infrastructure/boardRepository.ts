import type { Did } from "@atproto/did";
import { eq } from "drizzle-orm";

import { Board } from "~/models/board";
import type { Db } from "~/server/infrastructure/drizzle";
import { boardTable } from "~/server/infrastructure/schema";

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
    return new Board(ownerDid, Board.parseCards(JSON.parse(row.record)));
  },
  async save(board) {
    const data = {
      ownerDid: board.ownerDid,
      record: board.toRecordJSON(),
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
