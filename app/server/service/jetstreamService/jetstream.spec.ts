import { asDid } from "@atproto/did";
import { CommitType, EventType } from "@skyware/jetstream";
import { Pool } from "pg";
import { mock } from "vitest-mock-extended";

import { accountPdsRepositoryFactory } from "~/server/infrastructure/accountPdsRepository";
import { boardRepositoryFactory } from "~/server/infrastructure/boardRepository";
import { cursorRepositoryFactory } from "~/server/infrastructure/cursorRepository";
import { db } from "~/server/infrastructure/drizzle";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import { userDbRepositoryFactory } from "~/server/infrastructure/userDbRepository";
import { boardServiceFactory } from "~/server/service/boardService/board";
import { env } from "~/utils/env";

import { jetstreamServiceFactory } from "./jetstream";

const identityResolver = mock<IIdentityResolver>();

const jetstreamService = jetstreamServiceFactory({
  cursorRepository: cursorRepositoryFactory({ db }),
  boardService: boardServiceFactory({
    boardRepository: boardRepositoryFactory({ db }),
    userDbRepository: userDbRepositoryFactory({ db }),
    accountPdsRepository: accountPdsRepositoryFactory({ identityResolver }),
  }),
});

const pool = new Pool({ connectionString: env.DATABASE_URL });
afterAll(() => pool.end());

const dummyEvent = (did: string) =>
  ({
    did: asDid(did),
    time_us: Date.now() * 1000,
    kind: EventType.Commit,
    commit: {
      operation: CommitType.Create,
      rev: "abc",
      collection: "blue.linkat.board",
      rkey: "self",
      cid: "bafyreiflxe3gz7tg4jje5w4wypqjvz5d4zntrols22gwp7btg2nh2t7wxm",
      record: {
        $type: "blue.linkat.board",
        cards: [{ url: "https://example.com", text: "テスト" }],
      },
    },
  }) as const;

describe("jetstreamService", () => {
  describe("handleCreateOrUpdate", () => {
    test("持ち主の写しが無くても、写しを作成してボードを保存する", async () => {
      // arrange
      const did = "did:plc:newowner";
      identityResolver.resolve.mockResolvedValue(null);
      // act
      await jetstreamService.handleCreateOrUpdate(dummyEvent(did));
      // assert
      const { rows: users } = await pool.query(
        `SELECT * FROM "User" WHERE "did" = $1`,
        [did],
      );
      expect(users).toHaveLength(1);
      const { rows: boards } = await pool.query(
        `SELECT * FROM "Board" WHERE "userDid" = $1`,
        [did],
      );
      expect(boards).toHaveLength(1);
    });
    test("ボードの形式が不正なら、写しを作らずにスキップする", async () => {
      // arrange
      const did = "did:plc:invalidboard";
      const event = dummyEvent(did);
      // act
      await jetstreamService.handleCreateOrUpdate({
        ...event,
        commit: { ...event.commit, record: { $type: "blue.linkat.board" } },
      });
      // assert
      expect(identityResolver.resolve).not.toHaveBeenCalled();
      const { rows } = await pool.query(
        `SELECT * FROM "User" WHERE "did" = $1`,
        [did],
      );
      expect(rows).toHaveLength(0);
    });
  });
});
