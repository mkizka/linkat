import type { Did } from "@atproto/did";

import { LinkatAgent } from "~/libs/agent";
import { Board } from "~/models/board";
import type { IBoardRepository } from "~/server/infrastructure/boardRepository";
import type { IDidService } from "~/server/service/didService/did";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("boardService");

export interface IBoardService {
  parseBoardFromForm: (
    userDid: Did,
    rawBoard: string,
  ) => Promise<Board | Error>;
  saveBoard: (board: Board) => Promise<void>;
  findOrFetchBoard: (userDid: Did) => Promise<Board | null>;
  deleteBoard: (userDid: Did) => Promise<void>;
}

export const boardServiceFactory = ({
  boardRepository,
  didService,
}: {
  boardRepository: IBoardRepository;
  didService: IDidService;
}): IBoardService => {
  const fetchBoardInPDS = async (userDid: Did) => {
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
    const cards = await tryCatch((input: unknown) => Board.parseCards(input))(
      response.body.value,
    );
    if (cards instanceof Error) {
      logger.warn({ userDid }, "PDSからのboardの形式が不正でした");
      return null;
    }
    return new Board(userDid, cards);
  };

  return {
    parseBoardFromForm: tryCatch(
      (userDid: Did, rawBoard: string) =>
        new Board(userDid, Board.parseCards(JSON.parse(rawBoard))),
    ),
    async saveBoard(board) {
      await boardRepository.save(board);
    },
    // TODO: 全部の処理を一つのトランザクションで行う
    async findOrFetchBoard(userDid) {
      const board = await boardRepository.find(userDid);
      if (board) {
        return board;
      }
      const boardInPDS = await fetchBoardInPDS(userDid);
      if (!boardInPDS) {
        return null;
      }
      await boardRepository.save(boardInPDS);
      return boardInPDS;
    },
    async deleteBoard(userDid) {
      await boardRepository.delete(userDid);
    },
  };
};
