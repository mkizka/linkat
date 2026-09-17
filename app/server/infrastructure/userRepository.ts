import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";

import { User } from "~/models/user";
import { prisma } from "~/server/infrastructure/prisma";

type UserWriteData = {
  did: Did;
  avatar?: string | null;
  description?: string | null;
  displayName?: string | null;
  handle: string;
  updatedAt: Date;
};

export interface UserRepository {
  findByDid: (did: Did) => Promise<User | null>;
  findByHandle: (handle: string) => Promise<User | null>;
  save: (data: UserWriteData) => Promise<User>;
}

export const userRepository: UserRepository = {
  findByDid: async (did) => {
    const row = await prisma.user.findFirst({
      where: { did },
      orderBy: {
        createdAt: "desc",
      },
    });
    return row && new User({ ...row, did: asDid(row.did) });
  },
  findByHandle: async (handle) => {
    const row = await prisma.user.findFirst({
      where: { handle },
      orderBy: {
        createdAt: "desc",
      },
    });
    return row && new User({ ...row, did: asDid(row.did) });
  },
  save: async (data) => {
    const row = await prisma.user.upsert({
      where: { did: data.did },
      create: data,
      update: data,
    });
    return new User({ ...row, did: asDid(row.did) });
  },
};
