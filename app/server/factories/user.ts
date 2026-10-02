import { db } from "~/server/infrastructure/drizzle";
import { userTable } from "~/server/infrastructure/schema";

let seq = 0;

export const UserFactory = {
  create: async (overrides: Partial<typeof userTable.$inferInsert> = {}) => {
    seq += 1;
    const [user] = await db
      .insert(userTable)
      .values({
        did: `did:plc:${seq}`,
        handle: `test${seq}.example.com`,
        updatedAt: new Date(),
        ...overrides,
      })
      .returning();
    if (!user) {
      throw new Error("ユーザーの作成に失敗しました");
    }
    return user;
  },
};
