import type { Did } from "@atproto/did";
import { Client, XrpcResponseError } from "@atproto/lex";

import boardLexicon from "~/generated/blue/linkat/board";
import { boardSchema } from "~/schemas/board";
import type { IOAuthClient } from "~/server/infrastructure/auth/oauthClient";
import type { BoardDto } from "~/server/infrastructure/board/boardDto";

export interface IBoardPdsRepository {
  find: (did: Did) => Promise<BoardDto | null>;
  save: (board: BoardDto) => Promise<void>;
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
        return { ownerDid: did, cards: boardSchema.parse(body.value).cards };
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
