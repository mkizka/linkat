import { asDid, type Did } from "@atproto/did";
import { and, desc, eq, isNull, ne, or } from "drizzle-orm";

import type { Db } from "~/server/infrastructure/db/drizzle";
import { boardTable, ownerTable } from "~/server/infrastructure/db/schema";
import type { OwnerDto } from "~/server/infrastructure/owner/ownerDto";
import { toOwnerDto } from "~/server/infrastructure/owner/ownerRepository";

export interface IRecentOwnersQuery {
  find: (
    limit: number,
    excludeDid?: Did,
  ) => Promise<{ ownerDid: Did; owner: OwnerDto | null }[]>;
}

export const recentOwnersQueryFactory = ({
  db,
}: {
  db: Db;
}): IRecentOwnersQuery => ({
  async find(limit, excludeDid) {
    const rows = await db
      .select({ ownerDid: boardTable.ownerDid, owner: ownerTable })
      .from(boardTable)
      .leftJoin(ownerTable, eq(boardTable.ownerDid, ownerTable.did))
      .where(
        and(
          or(isNull(ownerTable.did), eq(ownerTable.active, true)),
          excludeDid && ne(boardTable.ownerDid, excludeDid),
        ),
      )
      .orderBy(desc(boardTable.updatedAt))
      .limit(limit);
    return rows.map((row) => ({
      ownerDid: asDid(row.ownerDid),
      owner: row.owner && toOwnerDto(row.owner),
    }));
  },
});
