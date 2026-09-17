import { prisma } from "~/server/infrastructure/prisma";

export type Board = {
  id: number;
  userDid: string;
  record: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface BoardRepository {
  findByUserDid: (userDid: string) => Promise<Board | null>;
  save: (data: { userDid: string; record: string }) => Promise<Board>;
  deleteByUserDid: (userDid: string) => Promise<void>;
}

export const boardRepository: BoardRepository = {
  findByUserDid: (userDid) =>
    prisma.board.findFirst({
      where: {
        user: {
          did: userDid,
        },
      },
      orderBy: {
        // ユーザーはハンドルの変更などで複数存在する可能性があるので、後から作成されたものを優先する
        user: {
          createdAt: "desc",
        },
      },
    }),
  save: (data) => {
    const createData = {
      user: {
        connect: {
          did: data.userDid,
        },
      },
      record: data.record,
      updatedAt: new Date(),
    };
    return prisma.board.upsert({
      where: {
        userDid: data.userDid,
      },
      update: createData,
      create: createData,
    });
  },
  deleteByUserDid: async (userDid) => {
    await prisma.board.deleteMany({
      where: {
        userDid,
      },
    });
  },
};
