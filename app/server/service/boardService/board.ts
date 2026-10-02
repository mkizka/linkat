import type { Did } from "@atproto/did";

import type { LinkatAgent } from "~/libs/agent";
import { Board } from "~/models/board";
import type { Owner } from "~/models/owner";
import type {
  IAccountPdsRepository,
  Profile,
} from "~/server/infrastructure/accountPdsRepository";
import type { IBoardRepository } from "~/server/infrastructure/boardRepository";
import type { IOwnerDbRepository } from "~/server/infrastructure/ownerDbRepository";
import { tryCatch } from "~/utils/tryCatch";

export class BoardPdsSaveError extends Error {
  constructor(cause: unknown) {
    super("PDSへのボードの保存に失敗しました", { cause });
  }
}

export class BoardDbSaveError extends Error {
  constructor(cause: unknown) {
    super("DBへのボードの保存に失敗しました", { cause });
  }
}

export class BoardPdsDeleteError extends Error {
  constructor(cause: unknown) {
    super("PDSからのボードの削除に失敗しました", { cause });
  }
}

export class BoardDbDeleteError extends Error {
  constructor(cause: unknown) {
    super("DBからのボードの削除に失敗しました", { cause });
  }
}

export interface IBoardService {
  parseBoardFromForm: (
    ownerDid: Did,
    rawBoard: string,
  ) => Promise<Board | Error>;
  // ボードを公開・更新した(/editのPOST、Jetstreamのcommit)。保存した持ち主の写しを返す
  saveBoard: (board: Board) => Promise<Owner>;
  publishBoard: (agent: LinkatAgent, board: Board) => Promise<Owner>;
  findBoard: (ownerDid: Did) => Promise<Board | null>;
  // ボードが削除された(Jetstream、/delete)
  deleteBoard: (ownerDid: Did) => Promise<void>;
  unpublishBoard: (agent: LinkatAgent, ownerDid: Did) => Promise<void>;
}

const emptyProfile: Profile = {
  avatar: null,
  avatarCid: null,
  description: null,
  displayName: null,
};

export const boardServiceFactory = ({
  boardRepository,
  ownerDbRepository,
  accountPdsRepository,
}: {
  boardRepository: IBoardRepository;
  ownerDbRepository: IOwnerDbRepository;
  accountPdsRepository: IAccountPdsRepository;
}): IBoardService => {
  const saveOwner = async (did: Did) => {
    const { handle, profile } = await accountPdsRepository.resolveAccount(did);
    // プロフィールの取得に失敗したときは、初回は空のまま、更新時は既存の値を残す
    const existing = profile ? null : await ownerDbRepository.findByDid(did);
    return await ownerDbRepository.save({
      did,
      ...(profile ??
        (existing && {
          avatar: existing.avatar,
          avatarCid: existing.avatarCid,
          description: existing.description,
          displayName: existing.displayName,
        }) ??
        emptyProfile),
      handle,
      updatedAt: new Date(),
    });
  };

  const saveBoard = async (board: Board) => {
    const owner = await saveOwner(board.ownerDid);
    await boardRepository.save(board);
    return owner;
  };

  // 写しを持つのはボードの持ち主だけなので、ボードと一緒に持ち主の写しも削除する
  // 途中で失敗したときに持ち主でない人の写しが残らないよう、持ち主の写しを先に削除する
  const deleteBoard = async (ownerDid: Did) => {
    await ownerDbRepository.delete(ownerDid);
    await boardRepository.delete(ownerDid);
  };

  return {
    parseBoardFromForm: tryCatch(
      (ownerDid: Did, rawBoard: string) =>
        new Board(ownerDid, Board.parseCards(JSON.parse(rawBoard))),
    ),
    saveBoard,
    async publishBoard(agent, board) {
      try {
        await agent.updateBoard(board);
      } catch (error) {
        throw new BoardPdsSaveError(error);
      }
      try {
        return await saveBoard(board);
      } catch (error) {
        throw new BoardDbSaveError(error);
      }
    },
    async findBoard(ownerDid) {
      return await boardRepository.find(ownerDid);
    },
    deleteBoard,
    async unpublishBoard(agent, ownerDid) {
      try {
        await agent.deleteBoard();
      } catch (error) {
        throw new BoardPdsDeleteError(error);
      }
      try {
        await deleteBoard(ownerDid);
      } catch (error) {
        throw new BoardDbDeleteError(error);
      }
    },
  };
};
