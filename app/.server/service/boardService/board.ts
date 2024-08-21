import type { Prisma, User } from "@prisma/client";

import { prisma } from "~/.server/service/prisma";
import { userService } from "~/.server/service/userService";
import { serverEnv } from "~/.server/utils/server-env";
import { LinkatAgent } from "~/libs/agent";
import { boardScheme, type ValidBoard } from "~/models/board";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("boardService");

const upsertBoard = async ({
  tx,
  user,
  board,
}: {
  tx: Prisma.TransactionClient;
  user: User;
  board: ValidBoard;
}) => {
  const data = {
    user: {
      connect: user,
    },
    record: JSON.stringify(board),
  } satisfies Prisma.BoardUpsertArgs["create"];
  const newBoard = await tx.board.upsert({
    where: {
      userDid: user.did,
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
    return await upsertBoard({ tx, user, board });
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
  const response = await tryCatch(agent.getBoard.bind(agent))({
    repo: handleOrDid,
  });
  if (response instanceof Error) {
    logger.error("boardの取得に失敗しました", { handleOrDid, response });
    return null;
  }
  const parsed = boardScheme.safeParse(response.value);
  if (!parsed.success) {
    logger.error("boardの取得に失敗しました", { handleOrDid, parsed });
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
