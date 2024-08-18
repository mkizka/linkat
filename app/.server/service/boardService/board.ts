import type { Prisma } from "@prisma/client";

import { prisma } from "~/.server/service/prisma";
import { userService } from "~/.server/service/userService";
import { serverEnv } from "~/.server/utils/server-env";
import { LinkatAgent } from "~/libs/agent";
import { boardScheme, type ValidBoard } from "~/models/board";
import { createLogger } from "~/utils/logger";

const logger = createLogger("boardService");

const upsertBoard = async ({
  tx,
  handleOrDid,
  board,
}: {
  tx: Prisma.TransactionClient;
  handleOrDid: string;
  board: ValidBoard;
}) => {
  const connect = handleOrDid.startsWith("did:")
    ? { did: handleOrDid }
    : { handle: handleOrDid };
  const data = {
    user: {
      connect,
    },
    record: JSON.stringify(board),
  } satisfies Prisma.BoardUpsertArgs["create"];
  const newBoard = await tx.board.upsert({
    where: {
      userDid: handleOrDid,
    },
    update: data,
    create: data,
  });
  // 保存前にバリデーションをかけているのでエラーが起きるのは異常
  return boardScheme.parse(JSON.parse(newBoard.record));
};

export const createOrUpdateBoard = async (
  handleOrDid: string,
  board: ValidBoard,
) => {
  return await prisma.$transaction(async (tx) => {
    const user = await userService.findOrFetchUser({ tx, handleOrDid });
    if (!user) {
      throw new Error("ユーザー作成に失敗しました");
    }
    return await upsertBoard({ tx, handleOrDid, board });
  });
};

const findBoard = async (handleOrDid: string) => {
  const user = handleOrDid.startsWith("did:")
    ? { did: handleOrDid }
    : { handle: handleOrDid };
  const board = await prisma.board.findFirst({
    where: {
      user,
    },
  });
  if (!board) {
    return null;
  }
  return boardScheme.parse(JSON.parse(board.record));
};

const fetchBoardInPDS = async (handleOrDid: string) => {
  logger.info("boardを取得します", { handleOrDid });
  const agent = new LinkatAgent({
    service: serverEnv.PUBLIC_BSKY_URL,
  });
  const response = await agent.getBoard({
    repo: handleOrDid,
  });
  const parsed = boardScheme.safeParse(response.value);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
};

// TODO: 全部の処理を一つのトランザクションで行う
export const findOrFetchBoard = async (handleOrDid: string) => {
  const board = await findBoard(handleOrDid);
  if (board) {
    return board;
  }
  const boardInPDS = await fetchBoardInPDS(handleOrDid);
  if (!boardInPDS) {
    return null;
  }
  return createOrUpdateBoard(handleOrDid, boardInPDS);
};
