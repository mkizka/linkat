import type { Prisma } from "@prisma/client";

import { LinkatAgent } from "~/libs/agent";
import { boardScheme, type ValidBoard } from "~/models/board";
import { createLogger } from "~/utils/logger";

import { prisma } from "../prisma";
import { serverEnv } from "../server-env";
import { userService } from "../userService";

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
    content: JSON.stringify(board.cards),
  } satisfies Prisma.BoardUpsertArgs["create"];
  return await tx.board.upsert({
    where: {
      userDid: handleOrDid,
    },
    update: data,
    create: data,
  });
};

export const createBoard = async (handleOrDid: string, board: ValidBoard) => {
  return await prisma.$transaction(async (tx) => {
    await userService.findOrFetchUser({ tx, handleOrDid });
    return await upsertBoard({ tx, handleOrDid, board });
  });
};

const findBoard = async ({ handleOrDid }: { handleOrDid: string }) => {
  const user = handleOrDid.startsWith("did:")
    ? { did: handleOrDid }
    : { handle: handleOrDid };
  return await prisma.board.findFirst({
    where: {
      user,
    },
  });
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

export const findOrFetchBoard = async ({
  handleOrDid,
}: {
  handleOrDid: string;
}) => {
  const board = await findBoard({ handleOrDid });
  if (board) {
    return board;
  }
  const boardInPDS = await fetchBoardInPDS(handleOrDid);
  if (!boardInPDS) {
    return null;
  }
  const newBoard = await createBoard(handleOrDid, boardInPDS);
  return {
    ...newBoard,
    cards: [],
  };
};
