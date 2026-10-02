import { asDid } from "@atproto/did";
import { CommitType, EventType } from "@skyware/jetstream";
import { Pool } from "pg";
import { mock, mockReset } from "vitest-mock-extended";

import { mockedLogger } from "~/mocks/logger";
import { User } from "~/models/user";
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

const userDbRepository = userDbRepositoryFactory({ db });

const jetstreamService = jetstreamServiceFactory({
  cursorRepository: cursorRepositoryFactory({ db }),
  boardService: boardServiceFactory({
    boardRepository: boardRepositoryFactory({ db }),
  }),
  userService: userServiceFactory({
    userRepository: userRepositoryFactory({
      userDbRepository,
      accountPdsRepository: accountPdsRepositoryFactory({ identityResolver }),
    }),
  }),
  userDbRepository,
  identityResolver,
});

const pool = new Pool({ connectionString: env.DATABASE_URL });
afterAll(() => pool.end());
beforeEach(() => mockReset(identityResolver));

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

const identityEvent = (did: string, handle?: `${string}.${string}`) =>
  ({
    did: asDid(did),
    time_us: Date.now() * 1000,
    kind: EventType.Identity,
    identity: {
      did: asDid(did),
      handle,
      seq: 1,
      time: new Date().toISOString(),
    },
  }) as const;

const found = (did: string, handle: string | null | undefined) =>
  ({
    type: "found",
    identity: { did: asDid(did), pds: "https://pds.example.com", handle },
  }) as const;

describe("jetstreamService", () => {
  describe("handleCreateOrUpdate", () => {
    test("ユーザーがDBになくDIDも解決できない場合、エラーにせずボードの保存をスキップする", async () => {
      // arrange
      const did = "did:plc:notfounduser0000000000000";
      identityResolver.resolve.mockResolvedValue({ type: "notFound" });
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

  describe("handleIdentity", () => {
    test("持ち主の写しが無いアカウントのイベントは、解決せずに捨てる", async () => {
      // arrange
      const did = "did:plc:notowner";
      // act
      await jetstreamService.handleIdentity(
        identityEvent(did, "new.example.com"),
      );
      // assert
      expect(identityResolver.resolve).not.toHaveBeenCalled();
      expect(await userDbRepository.findByDid(asDid(did))).toBeNull();
    });
    test("持ち主の写しがあれば、DIDからハンドルを解決し直して更新する", async () => {
      // arrange
      const user = await UserFactory.create({
        handle: "old.example.com",
        displayName: "表示名",
      });
      identityResolver.resolve.mockResolvedValue(
        found(user.did, "new.example.com"),
      );
      // act
      await jetstreamService.handleIdentity(
        identityEvent(user.did, "unverified.example.com"),
      );
      // assert
      expect(identityResolver.resolve).toHaveBeenCalledWith(user.did);
      const actual = await userDbRepository.findByDid(asDid(user.did));
      expect(actual?.handle).toBe("new.example.com");
      expect(actual?.displayName).toBe("表示名");
    });
    test("解決したハンドルを他の写しが持っていれば、そちらをnullにする", async () => {
      // arrange
      const other = await UserFactory.create({ handle: "new.example.com" });
      const user = await UserFactory.create({ handle: "old.example.com" });
      identityResolver.resolve.mockResolvedValue(
        found(user.did, "new.example.com"),
      );
      // act
      await jetstreamService.handleIdentity(identityEvent(user.did));
      // assert
      const actual = await userDbRepository.findByDid(asDid(user.did));
      expect(actual?.handle).toBe("new.example.com");
      const otherActual = await userDbRepository.findByDid(asDid(other.did));
      expect(otherActual?.handle).toBeNull();
    });
    test("ハンドルの検証に失敗したら、写しのハンドルをnullにする", async () => {
      // arrange
      const user = await UserFactory.create({ handle: "old.example.com" });
      identityResolver.resolve.mockResolvedValue(found(user.did, null));
      // act
      await jetstreamService.handleIdentity(identityEvent(user.did));
      // assert
      const actual = await userDbRepository.findByDid(asDid(user.did));
      expect(actual?.handle).toBeNull();
    });
    test("ハンドルの検証が一時的な障害で失敗したら、既存のハンドルを残す", async () => {
      // arrange
      const user = await UserFactory.create({ handle: "old.example.com" });
      identityResolver.resolve.mockResolvedValue(found(user.did, undefined));
      // act
      await jetstreamService.handleIdentity(identityEvent(user.did));
      // assert
      const actual = await userDbRepository.findByDid(asDid(user.did));
      expect(actual?.handle).toBe("old.example.com");
    });
    test.each(["notFound", "unavailable"] as const)(
      "DIDの解決結果が%sなら、写しを変えない",
      async (type) => {
        // arrange
        const user = await UserFactory.create({ handle: "old.example.com" });
        identityResolver.resolve.mockResolvedValue({ type });
        // act
        await jetstreamService.handleIdentity(identityEvent(user.did));
        // assert
        const actual = await userDbRepository.findByDid(asDid(user.did));
        expect(actual).toEqual(new User(user));
      },
    );
  });
});
