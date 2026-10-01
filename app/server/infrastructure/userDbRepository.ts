import type { Did } from "@atproto/did";
import { desc, eq } from "drizzle-orm";

import { User } from "~/models/user";
import type { Db } from "~/server/infrastructure/drizzle";
import { userTable } from "~/server/infrastructure/schema";

export interface IUserDbRepository {
  findByDid: (did: Did) => Promise<User | null>;
  findByHandle: (handle: string) => Promise<User | null>;
  save: (user: User) => Promise<User>;
  updateStatus: (did: Did, status: string) => Promise<void>;
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
      .orderBy(desc(userTable.createdAt))
      .limit(1);
    return row ? new User(row) : null;
  },
  async findByHandle(handle) {
    const [row] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.handle, handle))
      .orderBy(desc(userTable.createdAt))
      .limit(1);
    return row ? new User(row) : null;
  },
  async save(user) {
    const data = {
      did: user.did,
      avatar: user.avatar,
      description: user.description,
      displayName: user.displayName,
      handle: user.handle,
      updatedAt: user.updatedAt,
    };
    const [row] = await db
      .insert(userTable)
      .values(data)
      .onConflictDoUpdate({ target: userTable.did, set: data })
      .returning();
    if (!row) {
      throw new Error("ユーザーの保存に失敗しました");
    }
    return new User(row);
  },
  async updateStatus(did, status) {
    await db.update(userTable).set({ status }).where(eq(userTable.did, did));
  },
});
