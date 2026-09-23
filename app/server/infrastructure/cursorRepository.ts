import { eq } from "drizzle-orm";

import type { Db } from "~/server/infrastructure/drizzle";
import { jetstreamCursorTable } from "~/server/infrastructure/schema";

export interface ICursorRepository {
  load: () => Promise<number | undefined>;
  save: (cursor: number) => Promise<void>;
}

export const cursorRepositoryFactory = ({
  db,
}: {
  db: Db;
}): ICursorRepository => ({
  async load() {
    const [row] = await db
      .select()
      .from(jetstreamCursorTable)
      .where(eq(jetstreamCursorTable.id, 1));
    return row?.cursor;
  },
  async save(cursor) {
    await db
      .insert(jetstreamCursorTable)
      .values({ id: 1, cursor })
      .onConflictDoUpdate({ target: jetstreamCursorTable.id, set: { cursor } });
  },
});
