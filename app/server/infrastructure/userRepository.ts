import type { Did } from "@atproto/did";

import { User } from "~/models/user";
import { prisma } from "~/server/infrastructure/prisma";

export interface UserRepository {
  findByDid: (did: Did) => Promise<User | null>;
  findByHandle: (handle: string) => Promise<User | null>;
  save: (user: User) => Promise<void>;
}

export const userRepository: UserRepository = {
  findByDid: async (did) => {
    const row = await prisma.user.findFirst({
      where: { did },
      orderBy: {
        createdAt: "desc",
      },
    });
    return row && new User(row);
  },
  findByHandle: async (handle) => {
    const row = await prisma.user.findFirst({
      where: { handle },
      orderBy: {
        createdAt: "desc",
      },
    });
    return row && new User(row);
  },
  save: async (user) => {
    const data = {
      did: user.did,
      avatar: user.avatar,
      description: user.description,
      displayName: user.displayName,
      handle: user.handle,
      updatedAt: user.updatedAt,
    };
    await prisma.user.upsert({
      where: { did: user.did },
      create: data,
      update: data,
    });
  },
};
