import type { Prisma } from "@prisma/client";

import { LinkatAgent } from "~/libs/agent";
import { boardScheme, type ValidBoard } from "~/models/board";
import { didService } from "~/server/service/didService";
import { prisma } from "~/server/service/prisma";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

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
  logger.info("DIDからPDSのURLを解決します", { userDid });
  const serviceUrl = await didService.resolveServiceUrl(userDid);
  if (!serviceUrl) {
    return null;
  }
  logger.info("PDSからboardを取得します", { userDid });
  const agent = LinkatAgent.credential(serviceUrl);
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

export const deleteBoard = async (userDid: string) => {
  await prisma.board.deleteMany({
    where: {
      userDid,
    },
  });
};
