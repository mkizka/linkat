import type { Did } from "@atproto/did";
import { and, eq, ne } from "drizzle-orm";

import { type AccountStatus, Owner } from "~/models/owner";
import type { Db } from "~/server/infrastructure/drizzle";
import { ownerTable } from "~/server/infrastructure/schema";

export interface IOwnerDbRepository {
  findByDid: (did: Did) => Promise<Owner | null>;
  findByHandle: (handle: string) => Promise<Owner | null>;
  save: (owner: Owner) => Promise<Owner>;
  updateStatus: (did: Did, status: AccountStatus) => Promise<void>;
  delete: (did: Did) => Promise<void>;
}

export const ownerDbRepositoryFactory = ({
  db,
}: {
  db: Db;
}): IOwnerDbRepository => ({
  async findByDid(did) {
    const [row] = await db
      .select()
      .from(ownerTable)
      .where(eq(ownerTable.did, did))
      .limit(1);
    return row ? new Owner(row) : null;
  },
  async findByHandle(handle) {
    const [row] = await db
      .select()
      .from(ownerTable)
      .where(eq(ownerTable.handle, handle))
      .limit(1);
    return row ? new Owner(row) : null;
  },
  async save(owner) {
    const data = {
      did: owner.did,
      avatar: owner.avatar,
      avatarCid: owner.avatarCid,
      description: owner.description,
      displayName: owner.displayName,
      handle: owner.handle,
      updatedAt: owner.updatedAt,
    };
    return await db.transaction(async (tx) => {
      if (owner.handle) {
        await tx
          .update(ownerTable)
          .set({ handle: null })
          .where(
            and(
              eq(ownerTable.handle, owner.handle),
              ne(ownerTable.did, owner.did),
            ),
          );
      }
      const [row] = await tx
        .insert(ownerTable)
        .values(data)
        .onConflictDoUpdate({ target: ownerTable.did, set: data })
        .returning();
      if (!row) {
        throw new Error("持ち主の写しの保存に失敗しました");
      }
      return new Owner(row);
    });
  },
  async updateStatus(did, status) {
    await db.update(ownerTable).set({ status }).where(eq(ownerTable.did, did));
  },
  async delete(did) {
    await db.delete(ownerTable).where(eq(ownerTable.did, did));
  },
});
