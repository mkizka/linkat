import type { Prisma } from "@prisma/client";

import { LinkatAgent } from "~/libs/agent";
import { boardScheme, type ValidBoard } from "~/models/board";
import { prisma } from "~/server/service/prisma";
import { env } from "~/utils/env";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("boardService");

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
  logger.info("boardを保存します", { userDid });
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

const findBoard = async (userDid: string) => {
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

const fetchBoardInPDS = async (userDid: string) => {
  logger.info("PDSからboardを取得します", { userDid });
  const agent = new LinkatAgent({
    service: env.BSKY_PUBLIC_API_URL,
  });
  const response = await tryCatch(agent.getBoard.bind(agent))({
    repo: userDid,
  });
  if (response instanceof Error) {
    logger.warn("PDSからのboardの取得に失敗しました", { userDid, response });
    return null;
  }
  const parsed = boardScheme.safeParse(response.value);
  if (!parsed.success) {
    logger.warn("PDSからのboardの形式が不正でした", { userDid, parsed });
    return null;
  }
  return parsed.data;
};

// TODO: 全部の処理を一つのトランザクションで行う
export const findOrFetchBoard = async (userDid: string) => {
  const board = await findBoard(userDid);
  if (board) {
    return board;
  }
  const boardInPDS = await fetchBoardInPDS(userDid);
  if (!boardInPDS) {
    return null;
  }
  return createOrUpdateBoard({
    userDid,
    board: boardInPDS,
  });
};
