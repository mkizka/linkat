import type { Did } from "@atproto/did";
import { eq } from "drizzle-orm";

import { Board } from "~/models/board";
import type { Db } from "~/server/infrastructure/drizzle";
import { boardTable } from "~/server/infrastructure/schema";

export interface IBoardRepository {
  find: (userDid: Did) => Promise<Board | null>;
  save: (board: Board) => Promise<void>;
  delete: (userDid: Did) => Promise<void>;
}

export const boardRepositoryFactory = ({
  db,
}: {
  db: Db;
}): IBoardRepository => ({
  async find(userDid) {
    const [row] = await db
      .select()
      .from(boardTable)
      .where(eq(boardTable.userDid, userDid));
    if (!row) {
      return null;
    }
    return new Board(userDid, Board.parseCards(JSON.parse(row.record)));
  },
  async save(board) {
    const data = {
      userDid: board.userDid,
      record: board.toRecordJSON(),
      updatedAt: new Date(),
    };
    await db
      .insert(boardTable)
      .values(data)
      .onConflictDoUpdate({ target: boardTable.userDid, set: data });
  },
  async delete(userDid) {
    await db.delete(boardTable).where(eq(boardTable.userDid, userDid));
  },
});
