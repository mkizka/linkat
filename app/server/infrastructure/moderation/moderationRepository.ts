import type { Did } from "@atproto/did";
import { eq } from "drizzle-orm";

import type { Db } from "~/server/infrastructure/db/drizzle";
import { moderationTable } from "~/server/infrastructure/db/schema";
import type { ModerationLevelDto } from "~/server/infrastructure/moderation/moderationDto";

export interface IModerationRepository {
  findLevel: (did: Did) => Promise<ModerationLevelDto | null>;
  save: (did: Did, level: ModerationLevelDto | null) => Promise<void>;
}

export const moderationRepositoryFactory = ({
  db,
}: {
  db: Db;
}): IModerationRepository => ({
  async findLevel(did) {
    const [row] = await db
      .select({ level: moderationTable.level })
      .from(moderationTable)
      .where(eq(moderationTable.did, did))
      .limit(1);
    return row?.level ?? null;
  },
  async save(did, level) {
    if (!level) {
      await db.delete(moderationTable).where(eq(moderationTable.did, did));
      return;
    }
    await db
      .insert(moderationTable)
      .values({ did, level, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: moderationTable.did,
        set: { level, updatedAt: new Date() },
      });
  },
});
