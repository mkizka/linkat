import { asDid, type Did } from "@atproto/did";
import { desc, eq, isNull, or } from "drizzle-orm";

import { Owner } from "~/models/owner";
import type { Db } from "~/server/infrastructure/db/drizzle";
import { boardTable, ownerTable } from "~/server/infrastructure/db/schema";

export interface IRecentOwnersQuery {
  find: (limit: number) => Promise<{ ownerDid: Did; owner: Owner | null }[]>;
}

export const recentOwnersQueryFactory = ({
  db,
}: {
  db: Db;
}): IRecentOwnersQuery => ({
  async find(limit) {
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
