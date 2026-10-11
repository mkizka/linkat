import type { Did } from "@atproto/did";
import { Client, XrpcResponseError } from "@atproto/lex";

import boardLexicon from "~/generated/blue/linkat/board";
import { Board } from "~/models/board";
import type { IOAuthClient } from "~/server/infrastructure/auth/oauthClient";

export interface IBoardPdsRepository {
  find: (did: Did) => Promise<Board | null>;
  save: (board: Board) => Promise<void>;
  delete: (did: Did) => Promise<void>;
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
    async save(board) {
      const client = await createClient(board.ownerDid);
      await client.putRecord(
        { $type: boardLexicon.$type, cards: board.cards },
        "self",
        { repo: board.ownerDid, validate: false },
      );
    },
    async delete(did) {
      const client = await createClient(did);
      await client.deleteRecord(boardLexicon.$type, "self", { repo: did });
    },
  };
};
