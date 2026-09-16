import type { User } from "@prisma/client";

import { prisma } from "~/server/service/prisma";

type UserWriteData = {
  did: string;
  avatar?: string | null;
  description?: string | null;
  displayName?: string | null;
  handle: string;
};

export type UserRepository = {
  findUser: (handleOrDid: string) => Promise<User | null>;
  save: (data: UserWriteData) => Promise<User>;
};

export const userRepository: UserRepository = {
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
  save: (data) =>
    prisma.user.upsert({
      where: { did: data.did },
      create: data,
      update: data,
    }),
};
