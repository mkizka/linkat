import { prisma } from "~/server/service/prisma";

export const loadCursor = async (): Promise<number | undefined> => {
  const row = await prisma.jetstreamCursor.findUnique({ where: { id: 1 } });
  return row ? Number(row.cursor) : undefined;
};

export const saveCursor = async (cursor: number) => {
  await prisma.jetstreamCursor.upsert({
    where: { id: 1 },
    create: { id: 1, cursor: BigInt(cursor) },
    update: { cursor: BigInt(cursor) },
  });
};
