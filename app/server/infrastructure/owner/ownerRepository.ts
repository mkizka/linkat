import { asDid, type Did } from "@atproto/did";
import { and, eq, ne } from "drizzle-orm";

import type { Db } from "~/server/infrastructure/db/drizzle";
import { ownerTable } from "~/server/infrastructure/db/schema";
import type {
  AccountStateDto,
  OwnerDto,
  ProfileDto,
} from "~/server/infrastructure/owner/ownerDto";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export const toOwnerDto = (row: typeof ownerTable.$inferSelect): OwnerDto => ({
  did: asDid(row.did),
  handle: row.handle,
  avatarCid: row.avatarCid,
  description: row.description,
  displayName: row.displayName,
  active: row.active,
  status: row.status,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export interface IOwnerRepository {
  findByDid: (did: Did) => Promise<OwnerDto | null>;
  upsert: (
    did: Did,
    params: { handle: string | null; profile?: ProfileDto | null },
  ) => Promise<OwnerDto>;
  updateProfile: (
    did: Did,
    params: { handle: string | null; profile: ProfileDto | null },
  ) => Promise<OwnerDto | null>;
  updateHandle: (did: Did, handle: string | null) => Promise<OwnerDto | null>;
  updateAccountState: (did: Did, state: AccountStateDto) => Promise<void>;
  delete: (did: Did) => Promise<void>;
}

const profileColumns = (profile: ProfileDto | null) => ({
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
    return row ? toOwnerDto(row) : null;
  },
  async upsert(did, { handle, profile }) {
    const columns = {
      handle,
      ...(profile !== undefined && profileColumns(profile)),
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
      return toOwnerDto(row);
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
      return row ? toOwnerDto(row) : null;
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
      return row ? toOwnerDto(row) : null;
    });
  },
  async updateAccountState(did, state) {
    await db.update(ownerTable).set(state).where(eq(ownerTable.did, did));
  },
  async delete(did) {
    await db.delete(ownerTable).where(eq(ownerTable.did, did));
  },
});
