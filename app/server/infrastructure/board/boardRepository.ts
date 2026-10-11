import { asDid, type Did } from "@atproto/did";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { Board } from "~/models/board";
import type { Db } from "~/server/infrastructure/db/drizzle";
import { boardTable } from "~/server/infrastructure/db/schema";

export interface IBoardRepository {
  find: (ownerDid: Did) => Promise<Board | null>;
  save: (board: Board) => Promise<void>;
  delete: (ownerDid: Did) => Promise<void>;
  findRecentlyUpdated: (params: {
    ownerDids: Did[];
    limit?: number;
  }) => Promise<{ ownerDid: Did; updatedAt: Date }[]>;
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
    return Board.fromRecord(ownerDid, JSON.parse(row.record));
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
  async findRecentlyUpdated({ ownerDids, limit }) {
    const query = db
      .select({
        ownerDid: boardTable.ownerDid,
        updatedAt: boardTable.updatedAt,
      })
      .from(boardTable)
      .where(
        and(
          inArray(boardTable.ownerDid, ownerDids),
          sql`jsonb_array_length((${boardTable.record}::jsonb)->'cards') > 0`,
        ),
      )
      .orderBy(desc(boardTable.updatedAt))
      .$dynamic();
    const rows = await (limit ? query.limit(limit) : query);
    return rows.map((row) => ({ ...row, ownerDid: asDid(row.ownerDid) }));
  },
});
