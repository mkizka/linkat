import { asDid, type Did } from "@atproto/did";
import { eq } from "drizzle-orm";

import type { Db } from "~/server/infrastructure/drizzle";
import { ownerTable } from "~/server/infrastructure/schema";

export interface IHandleIndex {
  findDid: (handle: string) => Promise<Did | null>;
}

export const handleIndexFactory = ({ db }: { db: Db }): IHandleIndex => ({
  async findDid(handle) {
    const [row] = await db
      .select({ did: ownerTable.did })
      .from(ownerTable)
      .where(eq(ownerTable.handle, handle))
      .limit(1);
    return row ? asDid(row.did) : null;
  },
});
