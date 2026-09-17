import type { Did } from "@atproto/did";

import { Board } from "~/models/board";
import { prisma } from "~/server/infrastructure/prisma";

export interface BoardRepository {
  find: (userDid: Did) => Promise<Board | null>;
  save: (board: Board) => Promise<void>;
  delete: (userDid: Did) => Promise<void>;
}

export const boardRepository: BoardRepository = {
  find: async (userDid) => {
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
    return new Board(userDid, Board.parseCards(JSON.parse(row.record)));
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
  },
  delete: async (userDid) => {
    await prisma.board.deleteMany({
      where: {
        userDid,
      },
    });
  },
};
