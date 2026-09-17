import { prisma } from "~/server/infrastructure/prisma";

export interface CursorRepository {
  load: () => Promise<number | undefined>;
  save: (cursor: number) => Promise<void>;
}

export const cursorRepository: CursorRepository = {
  load: async () => {
    const row = await prisma.jetstreamCursor.findUnique({ where: { id: 1 } });
    return row ? Number(row.cursor) : undefined;
  },
  save: async (cursor) => {
    await prisma.jetstreamCursor.upsert({
      where: { id: 1 },
      create: { id: 1, cursor: BigInt(cursor) },
      update: { cursor: BigInt(cursor) },
    });
  },
};
