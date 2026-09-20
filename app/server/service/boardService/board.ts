import type { Did } from "@atproto/did";

import type { Board } from "~/models/board";
import type { BoardRepository } from "~/server/infrastructure/boardRepository";
import { boardRepository } from "~/server/infrastructure/boardRepository";

export const saveBoard = async (
  board: Board,
  { repository = boardRepository }: { repository?: BoardRepository } = {},
) => {
  await repository.save(board);
};

export const findBoard = async (
  userDid: Did,
  { repository = boardRepository }: { repository?: BoardRepository } = {},
) => {
  return await repository.find(userDid);
};

export const deleteBoard = async (
  userDid: Did,
  { repository = boardRepository }: { repository?: BoardRepository } = {},
) => {
  await repository.delete(userDid);
};
