import type { Did } from "@atproto/did";
import { eq } from "drizzle-orm";

import type { Db } from "~/server/infrastructure/db/drizzle";
import { moderationTable } from "~/server/infrastructure/db/schema";
import type { ModerationLevelDto } from "~/server/infrastructure/moderation/moderationDto";

export interface IModerationRepository {
  findLevel: (did: Did) => Promise<ModerationLevelDto>;
  save: (did: Did, level: ModerationLevelDto) => Promise<void>;
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
    return row?.level ?? "none";
  },
  async save(did, level) {
    if (level === "none") {
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
