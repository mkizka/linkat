import type { Did } from "@atproto/did";
import { and, eq, ne } from "drizzle-orm";

import { type AccountState, Owner, type Profile } from "~/models/owner";
import type { Db } from "~/server/infrastructure/db/drizzle";
import { ownerTable } from "~/server/infrastructure/db/schema";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export interface IOwnerRepository {
  findByDid: (did: Did) => Promise<Owner | null>;
  upsert: (
    did: Did,
    params: { handle: string | null; profile?: Profile },
  ) => Promise<Owner>;
  updateProfile: (
    did: Did,
    params: { handle: string | null; profile: Profile | null },
  ) => Promise<Owner | null>;
  updateHandle: (did: Did, handle: string | null) => Promise<Owner | null>;
  updateAccountState: (did: Did, state: AccountState) => Promise<void>;
  delete: (did: Did) => Promise<void>;
}

const profileColumns = (profile: Profile | null) => ({
  avatarCid: profile?.avatarCid ?? null,
  description: profile?.description ?? null,
  displayName: profile?.displayName ?? null,
});

const releaseHandle = async (tx: Tx, did: Did, handle: string | null) => {
  if (!handle) {
    return;
  }
  await tx
    .update(ownerTable)
    .set({ handle: null })
    .where(and(eq(ownerTable.handle, handle), ne(ownerTable.did, did)));
};

export const ownerRepositoryFactory = ({
  db,
}: {
  db: Db;
}): IOwnerRepository => ({
  async findByDid(did) {
    const [row] = await db
      .select()
      .from(ownerTable)
      .where(eq(ownerTable.did, did))
      .limit(1);
    return row ? new Owner(row) : null;
  },
  async upsert(did, { handle, profile }) {
    const columns = {
      handle,
      ...(profile && profileColumns(profile)),
      updatedAt: new Date(),
    };
    return await db.transaction(async (tx) => {
      await releaseHandle(tx, did, handle);
      const [row] = await tx
        .insert(ownerTable)
        .values({ did, ...columns })
        .onConflictDoUpdate({ target: ownerTable.did, set: columns })
        .returning();
      if (!row) {
        throw new Error("持ち主の保存に失敗しました");
      }
      return new Owner(row);
    });
  },
  async updateProfile(did, { handle, profile }) {
    return await db.transaction(async (tx) => {
      await releaseHandle(tx, did, handle);
      const [row] = await tx
        .update(ownerTable)
        .set({ handle, ...profileColumns(profile), updatedAt: new Date() })
        .where(eq(ownerTable.did, did))
        .returning();
      return row ? new Owner(row) : null;
    });
  },
  async updateHandle(did, handle) {
    return await db.transaction(async (tx) => {
      await releaseHandle(tx, did, handle);
      const [row] = await tx
        .update(ownerTable)
        .set({ handle, updatedAt: new Date() })
        .where(eq(ownerTable.did, did))
        .returning();
      return row ? new Owner(row) : null;
    });
  },
  async updateAccountState(did, state) {
    await db.update(ownerTable).set(state).where(eq(ownerTable.did, did));
  },
  async delete(did) {
    await db.delete(ownerTable).where(eq(ownerTable.did, did));
  },
});
