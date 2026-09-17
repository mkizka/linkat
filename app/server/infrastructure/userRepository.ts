import { prisma } from "~/server/infrastructure/prisma";

export type User = {
  did: string;
  avatar: string | null;
  description: string | null;
  displayName: string | null;
  handle: string;
  createdAt: Date;
  updatedAt: Date;
};

type UserWriteData = {
  did: string;
  avatar?: string | null;
  description?: string | null;
  displayName?: string | null;
  handle: string;
  updatedAt: Date;
};

export interface UserRepository {
  findByDid: (did: string) => Promise<User | null>;
  findByHandle: (handle: string) => Promise<User | null>;
  save: (data: UserWriteData) => Promise<User>;
}

export const userRepository: UserRepository = {
  findByDid: (did) =>
    prisma.user.findFirst({
      where: { did },
      orderBy: {
        createdAt: "desc",
      },
    }),
  findByHandle: (handle) =>
    prisma.user.findFirst({
      where: { handle },
      orderBy: {
        createdAt: "desc",
      },
    }),
  save: (data) =>
    prisma.user.upsert({
      where: { did: data.did },
      create: data,
      update: data,
    }),
};
