import type { Did } from "@atproto/did";
import { and, eq, ne } from "drizzle-orm";

import { User } from "~/models/user";
import type { Db } from "~/server/infrastructure/drizzle";
import { userTable } from "~/server/infrastructure/schema";

export type UserToSave = Omit<
  ConstructorParameters<typeof User>[0],
  "createdAt" | "handle"
> & {
  // undefinedのときは、既存の値を残す
  handle: string | null | undefined;
};

export interface IUserDbRepository {
  findByDid: (did: Did) => Promise<User | null>;
  findByHandle: (handle: string) => Promise<User | null>;
  save: (user: UserToSave) => Promise<User>;
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
  async findByHandle(handle) {
    const [row] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.handle, handle))
      .limit(1);
    return row ? new User(row) : null;
  },
  // 写しのハンドルを書き込む処理は、すべてこれを通す
  async save(user) {
    const data = {
      did: user.did,
      avatar: user.avatar,
      avatarCid: user.avatarCid,
      description: user.description,
      displayName: user.displayName,
      updatedAt: user.updatedAt,
    };
    return await db.transaction(async (tx) => {
      // ハンドルは他のアカウントに移ることがあるため、同じハンドルを持つ他の行を先にnullにする
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
        .values({ ...data, handle: user.handle ?? null })
        .onConflictDoUpdate({
          target: userTable.did,
          set:
            user.handle === undefined ? data : { ...data, handle: user.handle },
        })
        .returning();
      if (!row) {
        throw new Error("ユーザーの保存に失敗しました");
      }
      return new User(row);
    });
  },
});
