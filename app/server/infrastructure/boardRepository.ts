import { asDid, type Did } from "@atproto/did";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { Board } from "~/models/board";
import type { Db } from "~/server/infrastructure/drizzle";
import { boardTable } from "~/server/infrastructure/schema";

export interface IBoardRepository {
  find: (userDid: Did) => Promise<Board | null>;
  save: (board: Board) => Promise<void>;
  delete: (userDid: Did) => Promise<void>;
  findRecentlyUpdated: (params: {
    userDids: Did[];
    limit?: number;
  }) => Promise<{ userDid: Did; updatedAt: Date }[]>;
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
  async findRecentlyUpdated({ userDids, limit }) {
    const query = db
      .select({ userDid: boardTable.userDid, updatedAt: boardTable.updatedAt })
      .from(boardTable)
      .where(
        and(
          inArray(boardTable.userDid, userDids),
          sql`jsonb_array_length((${boardTable.record}::jsonb)->'cards') > 0`,
        ),
      )
      .orderBy(desc(boardTable.updatedAt))
      .$dynamic();
    const rows = await (limit ? query.limit(limit) : query);
    return rows.map((row) => ({ ...row, userDid: asDid(row.userDid) }));
  },
});
