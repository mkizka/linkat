import type { Did } from "@atproto/did";
import { Client, XrpcResponseError } from "@atproto/lex";

import boardLexicon from "~/generated/blue/linkat/board";
import putRecord from "~/generated/com/atproto/repo/putRecord";
import { Board } from "~/models/board";
import type { IOAuthClient } from "~/server/infrastructure/auth/oauthClient";

export interface IBoardPdsRepository {
  find: (did: Did) => Promise<Board | null>;
  save: (board: Board, options?: { onlyIfAbsent?: boolean }) => Promise<void>;
  delete: (did: Did) => Promise<void>;
}

export class BoardAlreadyExistsError extends Error {
  constructor(cause: unknown) {
    super("PDSに既にボードがありました", { cause });
  }
}

export const boardPdsRepositoryFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IBoardPdsRepository => {
  const createClient = async (did: Did) =>
    new Client(await oauthClient.restore(did));
  return {
    async find(did) {
      const client = await createClient(did);
      try {
        const { body } = await client.getRecord(boardLexicon.$type, "self", {
          repo: did,
        });
        return Board.fromRecord(did, body.value);
      } catch (error) {
        if (
          error instanceof XrpcResponseError &&
          error.error === "RecordNotFound"
        ) {
          return null;
        }
        throw error;
      }
    },
    async save(board, { onlyIfAbsent = false } = {}) {
      const client = await createClient(board.ownerDid);
      try {
        await client.xrpc(putRecord, {
          body: {
            repo: board.ownerDid,
            collection: boardLexicon.$type,
            rkey: "self",
            validate: false,
            record: { $type: boardLexicon.$type, cards: board.cards },
            ...(onlyIfAbsent && { swapRecord: null }),
          },
        });
      } catch (error) {
        if (
          error instanceof XrpcResponseError &&
          error.error === "InvalidSwap"
        ) {
          throw new BoardAlreadyExistsError(error);
        }
        throw error;
      }
    },
    async delete(did) {
      const client = await createClient(did);
      await client.deleteRecord(boardLexicon.$type, "self", { repo: did });
    },
  };
};
