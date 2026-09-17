import { Board } from "~/models/board";
import { prisma } from "~/server/service/prisma";

export interface BoardRepository {
  findByUserDid: (userDid: string) => Promise<Board | null>;
  save: (board: Board) => Promise<Board>;
  deleteByUserDid: (userDid: string) => Promise<void>;
}

export const boardRepository: BoardRepository = {
  findByUserDid: async (userDid) => {
    const row = await prisma.board.findFirst({
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
    });
    if (!row) {
      return null;
    }
    return Board.parse(userDid, JSON.parse(row.record));
  },
  save: async (board) => {
    const createData = {
      user: {
        connect: {
          did: board.userDid,
        },
      },
      record: board.toRecordJSON(),
      updatedAt: new Date(),
    };
    await prisma.board.upsert({
      where: {
        userDid: board.userDid,
      },
      update: createData,
      create: createData,
    });
    return board;
  },
  deleteByUserDid: async (userDid) => {
    await prisma.board.deleteMany({
      where: {
        userDid,
      },
    });
  },
};
