import type { Did } from "@atproto/did";
import { eq } from "drizzle-orm";

import { Board } from "~/models/board";
import { db } from "~/server/infrastructure/drizzle";
import { boardTable } from "~/server/infrastructure/schema";

export interface BoardRepository {
  find: (userDid: Did) => Promise<Board | null>;
  save: (board: Board) => Promise<void>;
  delete: (userDid: Did) => Promise<void>;
}

export const boardRepository: BoardRepository = {
  find: async (userDid) => {
    const [row] = await db
      .select()
      .from(boardTable)
      .where(eq(boardTable.userDid, userDid));
    if (!row) {
      return null;
    }
    return new Board(userDid, Board.parseCards(JSON.parse(row.record)));
  },
  save: async (board) => {
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
  delete: async (userDid) => {
    await db.delete(boardTable).where(eq(boardTable.userDid, userDid));
  },
};
