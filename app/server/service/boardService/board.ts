import { LinkatAgent } from "~/libs/agent";
import { Board } from "~/models/board";
import type { BoardRepository } from "~/server/infrastructure/boardRepository";
import { boardRepository } from "~/server/infrastructure/boardRepository";
import { didService } from "~/server/service/didService";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("boardService");

export const createOrUpdateBoard = async ({
  repository = boardRepository,
  userDid,
  board,
}: {
  repository?: BoardRepository;
  userDid: string;
  board: Board;
}) => {
  logger.info({ userDid }, "boardを保存します");
  await repository.save({ userDid, board });
  return board;
};

const findBoard = async (repository: BoardRepository, userDid: string) => {
  const board = await repository.findByUserDid(userDid);
  if (!board) {
    return null;
  }
  return Board.parse(JSON.parse(board.record));
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
  const board = await tryCatch((input: unknown) => Board.parse(input))(
    response.body.value,
  );
  if (board instanceof Error) {
    logger.warn({ userDid }, "PDSからのboardの形式が不正でした");
    return null;
  }
  return board;
};

// TODO: 全部の処理を一つのトランザクションで行う
export const findOrFetchBoard = async (
  userDid: string,
  { repository = boardRepository }: { repository?: BoardRepository } = {},
) => {
  const board = await findBoard(repository, userDid);
  if (board) {
    return board;
  }
  const boardInPDS = await fetchBoardInPDS(userDid);
  if (!boardInPDS) {
    return null;
  }
  return createOrUpdateBoard({
    repository,
    userDid,
    board: boardInPDS,
  });
};

export const deleteBoard = async (
  userDid: string,
  { repository = boardRepository }: { repository?: BoardRepository } = {},
) => {
  await repository.deleteByUserDid(userDid);
};
