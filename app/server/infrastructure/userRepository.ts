import type { Did } from "@atproto/did";
import { desc, eq } from "drizzle-orm";

import { User } from "~/models/user";
import type { Db } from "~/server/infrastructure/drizzle";
import { userTable } from "~/server/infrastructure/schema";

export interface IUserRepository {
  findByDid: (did: Did) => Promise<User | null>;
  findByHandle: (handle: string) => Promise<User | null>;
  save: (user: User) => Promise<void>;
}

export const userRepositoryFactory = ({ db }: { db: Db }): IUserRepository => ({
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
    await db
      .insert(userTable)
      .values(data)
      .onConflictDoUpdate({ target: userTable.did, set: data });
  },
});
