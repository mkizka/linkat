import type { Prisma } from "@prisma/client";

import { LinkatAgent } from "~/libs/agent";
import { boardScheme, type ValidBoard } from "~/models/board";
import { didService } from "~/server/service/didService";
import { prisma } from "~/server/service/prisma";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("boardService");

// 最後の取得から10分以上経過していたら再取得する
const shouldRefetch = (updatedAt: Date) => {
  return updatedAt <= new Date(Date.now() - 10 * 60 * 1000);
};

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

const findBoardRecord = async (userDid: string) => {
  return await prisma.board.findFirst({
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
};

const findBoard = async (userDid: string) => {
  const board = await findBoardRecord(userDid);
  if (!board) {
    return null;
  }
  return boardScheme.parse(JSON.parse(board.record));
};

const fetchBoardInPDS = async (userDid: string) => {
  logger.info({ userDid }, "DIDからPDSのURLを解決します");
  const serviceUrl = await didService.resolveServiceUrl(userDid);
  if (!serviceUrl) {
    return null;
  }
  logger.info({ userDid }, "PDSからboardを取得します");
  const agent = LinkatAgent.credential(serviceUrl);
  const response = await tryCatch(agent.getBoard.bind(agent))({
    repo: userDid,
  });
  if (response instanceof Error) {
    logger.warn({ userDid, response }, "PDSからのboardの取得に失敗しました");
    return null;
  }
  const parsed = boardScheme.safeParse(response.value);
  if (!parsed.success) {
    logger.warn({ userDid, parsed }, "PDSからのboardの形式が不正でした");
    return null;
  }
  return parsed.data;
};

// バックグラウンドでボード情報を更新する
const updateBoardInBackground = (userDid: string) => {
  // awaitせずにPromiseを開始してバックグラウンドで実行
  tryCatch(async () => {
    logger.info({ userDid }, "バックグラウンドでboardを更新します");
    const boardInPDS = await fetchBoardInPDS(userDid);
    if (boardInPDS) {
      await createOrUpdateBoard({
        userDid,
        board: boardInPDS,
      });
      logger.info({ userDid }, "バックグラウンドでのboard更新が完了しました");
    }
  })().catch((error) => {
    logger.warn(error, "バックグラウンドでのboard更新に失敗しました");
  });
};

// TODO: 全部の処理を一つのトランザクションで行う
export const findOrFetchBoard = async (userDid: string) => {
  const boardRecord = await findBoardRecord(userDid);

  // ボードが存在する場合
  if (boardRecord) {
    const board = boardScheme.parse(JSON.parse(boardRecord.record));
    // データが古い場合はバックグラウンドで更新
    if (shouldRefetch(boardRecord.updatedAt)) {
      updateBoardInBackground(userDid);
    }
    return board;
  }

  // ボードが存在しない場合(初回訪問)は、PDSから取得してから返す
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
