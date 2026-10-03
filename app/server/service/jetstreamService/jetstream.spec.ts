import { asDid } from "@atproto/did";
import { CommitType, EventType } from "@skyware/jetstream";
import { Pool } from "pg";
import { mock } from "vitest-mock-extended";

import { mockedLogger } from "~/mocks/logger";
import { UserFactory } from "~/server/factories/user";
import { accountPdsRepositoryFactory } from "~/server/infrastructure/accountPdsRepository";
import { boardRepositoryFactory } from "~/server/infrastructure/boardRepository";
import { cursorRepositoryFactory } from "~/server/infrastructure/cursorRepository";
import { db } from "~/server/infrastructure/drizzle";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import { userDbRepositoryFactory } from "~/server/infrastructure/userDbRepository";
import { userRepositoryFactory } from "~/server/infrastructure/userRepository";
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
    userRepository: userRepositoryFactory({
      userDbRepository: userDbRepositoryFactory({ db }),
      accountPdsRepository: accountPdsRepositoryFactory({ identityResolver }),
    }),
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
    test("ユーザーがDBになくDIDも解決できない場合、エラーにせずボードの保存をスキップする", async () => {
      // arrange
      const did = "did:plc:notfounduser0000000000000";
      identityResolver.resolve.mockResolvedValue(null);
      // act
      const actual = jetstreamService.handleCreateOrUpdate(dummyEvent(did));
      // assert
      await expect(actual).resolves.toBeUndefined();
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        { did },
        "ユーザーが見つからないためボードの更新をスキップしました",
      );
      const { rows } = await pool.query(
        `SELECT * FROM "Board" WHERE "userDid" = $1`,
        [did],
      );
      expect(rows).toHaveLength(0);
    });
  });

  describe("handleAccount", () => {
    const accountEvent = (
      did: string,
      account: { active: boolean; status?: string },
    ) => ({
      did: asDid(did),
      time_us: Date.now() * 1000,
      kind: EventType.Account,
      account: {
        did: asDid(did),
        seq: 1,
        time: new Date().toISOString(),
        ...account,
      },
    });

    test.each`
      account                                        | expected
      ${{ active: false, status: "takendown" }}      | ${"suspended"}
      ${{ active: false, status: "suspended" }}      | ${"suspended"}
      ${{ active: false, status: "deleted" }}        | ${"deleted"}
      ${{ active: false, status: "deactivated" }}    | ${"deactivated"}
      ${{ active: false, status: "desynchronized" }} | ${"inactive"}
      ${{ active: false, status: "throttled" }}      | ${"inactive"}
      ${{ active: false }}                           | ${"inactive"}
      ${{ active: true }}                            | ${"active"}
    `(
      "$account.status を $expected として記録する",
      async ({
        account,
        expected,
      }: {
        account: { active: boolean; status?: string };
        expected: string;
      }) => {
        // arrange
        const user = await UserFactory.create({ status: "deleted" });
        // act
        await jetstreamService.handleAccount(accountEvent(user.did, account));
        // assert
        const { rows } = await pool.query(
          `SELECT status FROM "User" WHERE did = $1`,
          [user.did],
        );
        expect(rows).toEqual([{ status: expected }]);
      },
    );
  });
});
