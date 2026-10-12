import { asDid, type Did } from "@atproto/did";
import { desc, eq, isNull, or } from "drizzle-orm";

import { Board } from "~/models/board";
import { Owner } from "~/models/owner";
import type { Db } from "~/server/infrastructure/db/drizzle";
import { boardTable, ownerTable } from "~/server/infrastructure/db/schema";

export interface IBoardRepository {
  find: (ownerDid: Did) => Promise<Board | null>;
  save: (board: Board) => Promise<void>;
  delete: (ownerDid: Did) => Promise<void>;
  findRecentOwners: (
    limit: number,
  ) => Promise<{ ownerDid: Did; owner: Owner | null }[]>;
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
  async findRecentOwners(limit) {
    const rows = await db
      .select({ ownerDid: boardTable.ownerDid, owner: ownerTable })
      .from(boardTable)
      .leftJoin(ownerTable, eq(boardTable.ownerDid, ownerTable.did))
      .where(or(isNull(ownerTable.did), eq(ownerTable.active, true)))
      .orderBy(desc(boardTable.updatedAt))
      .limit(limit);
    return rows.map((row) => ({
      ownerDid: asDid(row.ownerDid),
      owner: row.owner && new Owner(row.owner),
    }));
  },
});
