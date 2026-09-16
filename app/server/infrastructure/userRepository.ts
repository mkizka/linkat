import type { User } from "@prisma/client";

import { prisma } from "~/server/service/prisma";

type UserWriteData = {
  did: string;
  avatar?: string | null;
  description?: string | null;
  displayName?: string | null;
  handle: string;
};

// userServiceが差し替え可能なDBアクセスの抽象。Prisma固有の型に依存しない
export type UserRepository = {
  findUser: (handleOrDid: string) => Promise<User | null>;
  upsertUser: (data: UserWriteData) => Promise<User>;
};

export const prismaUserRepository: UserRepository = {
  findUser: (handleOrDid) => {
    const where = handleOrDid.startsWith("did:")
      ? { did: handleOrDid }
      : { handle: handleOrDid };
    return prisma.user.findFirst({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });
  },
  upsertUser: (data) =>
    prisma.user.upsert({
      where: { did: data.did },
      create: data,
      update: data,
    }),
};
