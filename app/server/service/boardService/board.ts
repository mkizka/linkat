import type { Did } from "@atproto/did";

import type { BoardRepository } from "~/server/infrastructure/boardRepository";
import { boardRepository } from "~/server/infrastructure/boardRepository";

export const findBoard = async (
  userDid: Did,
  { repository = boardRepository }: { repository?: BoardRepository } = {},
) => {
  return repository.find(userDid);
};

export const deleteBoard = async (
  userDid: Did,
  { repository = boardRepository }: { repository?: BoardRepository } = {},
) => {
  await repository.delete(userDid);
};
