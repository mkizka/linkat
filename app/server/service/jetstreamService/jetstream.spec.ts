import { asDid } from "@atproto/did";
import { CommitType, EventType } from "@skyware/jetstream";
import { http, HttpResponse } from "msw";
import { Pool } from "pg";
import { mock } from "vitest-mock-extended";

import { server } from "~/mocks/server";
import { boardRepositoryFactory } from "~/server/infrastructure/boardRepository";
import { cursorRepositoryFactory } from "~/server/infrastructure/cursorRepository";
import { db } from "~/server/infrastructure/drizzle";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import { userBskyRepositoryFactory } from "~/server/infrastructure/userBskyRepository";
import { userDbRepositoryFactory } from "~/server/infrastructure/userDbRepository";
import { boardServiceFactory } from "~/server/service/boardService/board";
import { userServiceFactory } from "~/server/service/userService/user";
import { env } from "~/utils/env";

import { jetstreamServiceFactory } from "./jetstream";

const identityResolver = mock<IIdentityResolver>();

const jetstreamService = jetstreamServiceFactory({
  cursorRepository: cursorRepositoryFactory({ db }),
  boardService: boardServiceFactory({
    boardRepository: boardRepositoryFactory({ db }),
  }),
  userService: userServiceFactory({
    identityResolver,
    userDbRepository: userDbRepositoryFactory({ db }),
    userBskyRepository: userBskyRepositoryFactory({ identityResolver }),
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
    test("DBにユーザーがいなければBlueskyから取得して作成し、ボードを保存する", async () => {
      // arrange
      const did = "did:plc:newuser000000000000000000";
      identityResolver.resolve.mockResolvedValue({
        did: asDid(did),
        handle: "new.example.com",
      });
      server.use(
        http.get(
          "https://public.api.example.com/xrpc/app.bsky.actor.getProfile",
          () => HttpResponse.json({ did, handle: "new.example.com" }),
        ),
      );
      // act
      await jetstreamService.handleCreateOrUpdate(dummyEvent(did));
      // assert
      const users = await pool.query(`SELECT * FROM "User" WHERE did = $1`, [
        did,
      ]);
      expect(users.rows).toHaveLength(1);
      const boards = await pool.query(
        `SELECT * FROM "Board" WHERE "userDid" = $1`,
        [did],
      );
      expect(boards.rows).toHaveLength(1);
    });
    test("DIDを解決できずプロフィールも取得できない場合も、ユーザーを作成してボードを保存する", async () => {
      // arrange
      const did = "did:plc:unresolvable00000000000000";
      identityResolver.resolve.mockResolvedValue(null);
      server.use(
        http.get(
          "https://public.api.example.com/xrpc/app.bsky.actor.getProfile",
          () => HttpResponse.json("", { status: 500 }),
        ),
      );
      // act
      await jetstreamService.handleCreateOrUpdate(dummyEvent(did));
      // assert
      const users = await pool.query(`SELECT * FROM "User" WHERE did = $1`, [
        did,
      ]);
      expect(users.rows).toEqual([
        expect.objectContaining({ did, handle: "handle.invalid" }),
      ]);
      const boards = await pool.query(
        `SELECT * FROM "Board" WHERE "userDid" = $1`,
        [did],
      );
      expect(boards.rows).toHaveLength(1);
    });
  });
});
