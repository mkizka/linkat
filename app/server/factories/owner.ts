import { db } from "~/server/infrastructure/db/drizzle";
import { ownerTable } from "~/server/infrastructure/db/schema";

let seq = 0;

export const OwnerFactory = {
  create: async (overrides: Partial<typeof ownerTable.$inferInsert> = {}) => {
    seq += 1;
    const [owner] = await db
      .insert(ownerTable)
      .values({
        did: `did:plc:${seq}`,
        handle: `test${seq}.example.com`,
        updatedAt: new Date(),
        ...overrides,
      })
      .returning();
    if (!owner) {
      throw new Error("持ち主の作成に失敗しました");
    }
    return owner;
  },
};
