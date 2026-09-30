import type { Did } from "@atproto/did";
import { eq } from "drizzle-orm";

import { User } from "~/models/user";
import type { Db } from "~/server/infrastructure/drizzle";
import { userTable } from "~/server/infrastructure/schema";

export interface IUserDbRepository {
  findByDid: (did: Did) => Promise<User | null>;
  save: (user: User) => Promise<User>;
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
      .where(eq(userTable.did, did));
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
});
