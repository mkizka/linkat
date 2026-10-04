import type { Did } from "@atproto/did";
import { and, eq, ne } from "drizzle-orm";

import { type AccountStatus, User } from "~/models/user";
import type { Db } from "~/server/infrastructure/drizzle";
import { userTable } from "~/server/infrastructure/schema";

export interface IUserDbRepository {
  findByDid: (did: Did) => Promise<User | null>;
  save: (user: User) => Promise<User>;
  updateStatus: (did: Did, status: AccountStatus) => Promise<void>;
  delete: (did: Did) => Promise<void>;
}

export const userDbRepositoryFactory = ({
  db,
}: {
  db: Db;
}): IUserDbRepository => ({
  async findByDid(did) {
    const [row] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.did, did))
      .limit(1);
    return row ? new User(row) : null;
  },
  async save(user) {
    const data = {
      did: user.did,
      avatar: user.avatar,
      avatarCid: user.avatarCid,
      description: user.description,
      displayName: user.displayName,
      handle: user.handle,
      updatedAt: user.updatedAt,
    };
    return await db.transaction(async (tx) => {
      if (user.handle) {
        await tx
          .update(userTable)
          .set({ handle: null })
          .where(
            and(eq(userTable.handle, user.handle), ne(userTable.did, user.did)),
          );
      }
      const [row] = await tx
        .insert(userTable)
        .values(data)
        .onConflictDoUpdate({ target: userTable.did, set: data })
        .returning();
      if (!row) {
        throw new Error("ユーザーの保存に失敗しました");
      }
      return new User(row);
    });
  },
  async updateStatus(did, status) {
    await db.update(userTable).set({ status }).where(eq(userTable.did, did));
  },
  async delete(did) {
    await db.delete(userTable).where(eq(userTable.did, did));
  },
});
