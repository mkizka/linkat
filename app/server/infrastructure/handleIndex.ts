import { asDid, type Did } from "@atproto/did";
import { eq } from "drizzle-orm";

import type { Db } from "~/server/infrastructure/drizzle";
import { userTable } from "~/server/infrastructure/schema";

export interface IHandleIndex {
  findDid: (handle: string) => Promise<Did | null>;
}

export const handleIndexFactory = ({ db }: { db: Db }): IHandleIndex => ({
  async findDid(handle) {
    const [row] = await db
      .select({ did: userTable.did })
      .from(userTable)
      .where(eq(userTable.handle, handle))
      .limit(1);
    return row ? asDid(row.did) : null;
  },
});
