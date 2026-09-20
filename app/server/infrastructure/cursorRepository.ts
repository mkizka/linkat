import { db } from "~/server/infrastructure/drizzle";
import { jetstreamCursorTable } from "~/server/infrastructure/schema";

export interface CursorRepository {
  load: () => Promise<number | undefined>;
  save: (cursor: number) => Promise<void>;
}

export const cursorRepository: CursorRepository = {
  load: async () => {
    const [row] = await db.select().from(jetstreamCursorTable);
    return row?.cursor;
  },
  save: async (cursor) => {
    await db
      .insert(jetstreamCursorTable)
      .values({ id: 1, cursor })
      .onConflictDoUpdate({
        target: jetstreamCursorTable.id,
        set: { cursor },
      });
  },
};
