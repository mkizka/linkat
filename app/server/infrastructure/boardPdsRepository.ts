import type { Did } from "@atproto/did";
import { Client } from "@atproto/lex";

import boardLexicon from "~/generated/blue/linkat/board";
import type { Board } from "~/models/board";
import type { IOAuthClient } from "~/server/infrastructure/oauthClient";

export interface IBoardPdsRepository {
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
