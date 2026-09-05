import type { Prisma } from "@prisma/client";

import { boardScheme, type ValidBoard } from "~/models/board";
import { prisma } from "~/server/service/prisma";
import { createLogger } from "~/utils/logger";

const logger = createLogger("boardService");

// TODO: boardをunknownで受け入れてこの関数内でパースする
export const createOrUpdateBoard = async ({
  userDid,
  board,
}: {
  userDid: string;
  board: ValidBoard;
}) => {
  const data = {
    user: {
      connect: {
        did: userDid,
      },
    },
    record: JSON.stringify(board),
  } satisfies Prisma.BoardUpsertArgs["create"];
  logger.info({ userDid }, "boardを保存します");
  const newBoard = await prisma.board.upsert({
    where: {
      userDid,
    },
    update: data,
    create: data,
  });
  // 保存前にバリデーションをかけているのでエラーが起きるのは異常
  return boardScheme.parse(JSON.parse(newBoard.record));
};

export const findBoard = async (userDid: string) => {
  const board = await prisma.board.findFirst({
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
  if (!board) {
    return null;
  }
  return boardScheme.parse(JSON.parse(board.record));
};

export const deleteBoard = async (userDid: string) => {
  await prisma.board.deleteMany({
    where: {
      userDid,
    },
  });
};
