import type { Did } from "@atproto/did";
import { desc, eq, sql } from "drizzle-orm";

import { Board } from "~/models/board";
import { User } from "~/models/user";
import type { Db } from "~/server/infrastructure/drizzle";
import { boardTable, userTable } from "~/server/infrastructure/schema";

export interface IBoardRepository {
  find: (userDid: Did) => Promise<Board | null>;
  save: (board: Board) => Promise<void>;
  delete: (userDid: Did) => Promise<void>;
  findRecentlyUpdatedUsers: (limit: number) => Promise<User[]>;
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
  async findRecentlyUpdatedUsers(limit) {
    const rows = await db
      .select({ user: userTable })
      .from(boardTable)
      .innerJoin(userTable, eq(boardTable.userDid, userTable.did))
      .where(
        sql`jsonb_array_length((${boardTable.record})::jsonb -> 'cards') > 0`,
      )
      .orderBy(desc(boardTable.updatedAt))
      .limit(limit);
    return rows.map((row) => new User(row.user));
  },
});
