import type { Did } from "@atproto/did";
import { and, eq, ne } from "drizzle-orm";

import { Owner } from "~/models/owner";
import type { Db } from "~/server/infrastructure/drizzle";
import { ownerTable } from "~/server/infrastructure/schema";

export type OwnerToSave = Omit<
  ConstructorParameters<typeof Owner>[0],
  "createdAt" | "handle"
> & {
  // undefinedのときは、既存の値を残す
  handle: string | null | undefined;
};

export interface IOwnerDbRepository {
  findByDid: (did: Did) => Promise<Owner | null>;
  findByHandle: (handle: string) => Promise<Owner | null>;
  save: (owner: OwnerToSave) => Promise<Owner>;
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
  // 写しのハンドルを書き込む処理は、すべてこれを通す
  async save(owner) {
    const data = {
      did: owner.did,
      avatar: owner.avatar,
      avatarCid: owner.avatarCid,
      description: owner.description,
      displayName: owner.displayName,
      updatedAt: owner.updatedAt,
    };
    return await db.transaction(async (tx) => {
      // ハンドルは他のアカウントに移ることがあるため、同じハンドルを持つ他の行を先にnullにする
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
        .values({ ...data, handle: owner.handle ?? null })
        .onConflictDoUpdate({
          target: ownerTable.did,
          set:
            owner.handle === undefined
              ? data
              : { ...data, handle: owner.handle },
        })
        .returning();
      if (!row) {
        throw new Error("持ち主の写しの保存に失敗しました");
      }
      return new Owner(row);
    });
  },
  async delete(did) {
    await db.delete(ownerTable).where(eq(ownerTable.did, did));
  },
});
