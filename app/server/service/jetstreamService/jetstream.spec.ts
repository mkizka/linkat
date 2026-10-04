import { asDid } from "@atproto/did";
import type { CommitDeleteEvent, CommitUpdateEvent } from "@skyware/jetstream";
import { CommitType, EventType } from "@skyware/jetstream";
import { http, HttpResponse } from "msw";
import { Pool } from "pg";
import { mock, mockReset } from "vitest-mock-extended";

import { server } from "~/mocks/server";
import { OwnerFactory } from "~/server/factories/owner";
import { boardRepositoryFactory } from "~/server/infrastructure/boardRepository";
import { cursorRepositoryFactory } from "~/server/infrastructure/cursorRepository";
import { db } from "~/server/infrastructure/drizzle";
import { handleIndexFactory } from "~/server/infrastructure/handleIndex";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import { ownerDbRepositoryFactory } from "~/server/infrastructure/ownerDbRepository";
import { profileFetcherFactory } from "~/server/infrastructure/profileFetcher";
import { profileRecordParserFactory } from "~/server/infrastructure/profileRecordParser";
import { boardServiceFactory } from "~/server/service/boardService/board";
import { ownerServiceFactory } from "~/server/service/ownerService/owner";
import { env } from "~/utils/env";

import { jetstreamServiceFactory } from "./jetstream";

const identityResolver = mock<IIdentityResolver>();
const ownerDbRepository = ownerDbRepositoryFactory({ db });
const profileRecordParser = profileRecordParserFactory();
const profileFetcher = profileFetcherFactory({
  profileRecordParser,
});

const jetstreamService = jetstreamServiceFactory({
  cursorRepository: cursorRepositoryFactory({ db }),
  boardService: boardServiceFactory({
    boardRepository: boardRepositoryFactory({ db }),
    ownerDbRepository,
  }),
  ownerService: ownerServiceFactory({
    handleIndex: handleIndexFactory({ db }),
    ownerDbRepository,
    profileFetcher,
    identityResolver,
  }),
  ownerDbRepository,
  identityResolver,
  profileRecordParser,
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

const avatarCid = "bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku";

type ProfileRecord =
  CommitUpdateEvent<"app.bsky.actor.profile">["commit"]["record"];

const profileUpdateEvent = (
  did: string,
  record: ProfileRecord,
  rkey = "self",
): CommitUpdateEvent<"app.bsky.actor.profile"> => ({
  did: asDid(did),
  time_us: Date.now() * 1000,
  kind: EventType.Commit,
  commit: {
    operation: CommitType.Update,
    rev: "abc",
    collection: "app.bsky.actor.profile",
    rkey,
    cid: "bafyreiflxe3gz7tg4jje5w4wypqjvz5d4zntrols22gwp7btg2nh2t7wxm",
    record,
  },
});

const profileDeleteEvent = (
  did: string,
): CommitDeleteEvent<"app.bsky.actor.profile"> => ({
  did: asDid(did),
  time_us: Date.now() * 1000,
  kind: EventType.Commit,
  commit: {
    operation: CommitType.Delete,
    rev: "abc",
    collection: "app.bsky.actor.profile",
    rkey: "self",
  },
});

const profileRecord: ProfileRecord = {
  $type: "app.bsky.actor.profile",
  displayName: "新しい名前",
  description: "新しい説明",
  avatar: {
    $type: "blob",
    ref: { $link: avatarCid },
    mimeType: "image/jpeg",
    size: 1000,
  },
};

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

const found = (did: string, handle: string | null) => ({
  did: asDid(did),
  pds: "https://pds.example.com",
  handle,
});

describe("jetstreamService", () => {
  describe("handleProfileCommit", () => {
    test("持ち主の写しがあれば、レコードの値でプロフィールを更新し、ハンドルを解決し直す", async () => {
      // arrange
      const owner = await OwnerFactory.create({
        handle: "old.example.com",
        displayName: "古い名前",
      });
      identityResolver.resolve.mockResolvedValue(
        found(owner.did, "new.example.com"),
      );
      // act
      await jetstreamService.handleProfileCommit(
        profileUpdateEvent(owner.did, profileRecord),
      );
      // assert
      const actual = await ownerDbRepository.findByDid(asDid(owner.did));
      expect(actual).toMatchObject({
        handle: "new.example.com",
        displayName: "新しい名前",
        description: "新しい説明",
        avatarCid,
        avatar: null,
      });
    });
    test("プロフィールのレコードが削除された場合、プロフィールを空にする", async () => {
      // arrange
      const owner = await OwnerFactory.create({
        displayName: "古い名前",
        description: "古い説明",
        avatarCid,
      });
      identityResolver.resolve.mockResolvedValue(
        found(owner.did, owner.handle),
      );
      // act
      await jetstreamService.handleProfileCommit(profileDeleteEvent(owner.did));
      // assert
      const actual = await ownerDbRepository.findByDid(asDid(owner.did));
      expect(actual).toMatchObject({
        handle: owner.handle,
        displayName: null,
        description: null,
        avatarCid: null,
      });
    });
    test("ハンドルを解決できなかった場合、写しのハンドルをnullにしてプロフィールは更新する", async () => {
      // arrange
      const owner = await OwnerFactory.create({ handle: "old.example.com" });
      identityResolver.resolve.mockResolvedValue(null);
      // act
      await jetstreamService.handleProfileCommit(
        profileUpdateEvent(owner.did, profileRecord),
      );
      // assert
      const actual = await ownerDbRepository.findByDid(asDid(owner.did));
      expect(actual).toMatchObject({ handle: null, displayName: "新しい名前" });
    });
    test("持ち主の写しが無いアカウントのイベントは捨てる", async () => {
      // arrange
      const did = "did:plc:notowner0000000000000000";
      // act
      await jetstreamService.handleProfileCommit(
        profileUpdateEvent(did, profileRecord),
      );
      // assert
      expect(identityResolver.resolve).not.toHaveBeenCalled();
      expect(await ownerDbRepository.findByDid(asDid(did))).toBeNull();
    });
    test("レコードが不正な場合、既存の値を残す", async () => {
      // arrange
      const owner = await OwnerFactory.create({ displayName: "古い名前" });
      // act
      await jetstreamService.handleProfileCommit(
        profileUpdateEvent(owner.did, {
          $type: "app.bsky.actor.profile",
          displayName: "あ".repeat(65),
        }),
      );
      // assert
      expect(identityResolver.resolve).not.toHaveBeenCalled();
      const actual = await ownerDbRepository.findByDid(asDid(owner.did));
      expect(actual).toEqual(owner);
    });
    test("rkeyがself以外のレコードは無視する", async () => {
      // arrange
      const owner = await OwnerFactory.create({ displayName: "古い名前" });
      // act
      await jetstreamService.handleProfileCommit(
        profileUpdateEvent(owner.did, profileRecord, "other"),
      );
      // assert
      const actual = await ownerDbRepository.findByDid(asDid(owner.did));
      expect(actual).toEqual(owner);
    });
  });

  describe("handleCreateOrUpdate", () => {
    test("持ち主の写しが無ければ、DIDを解決できなくても写しを作ってボードを保存する", async () => {
      // arrange
      const did = "did:plc:newowner";
      identityResolver.resolve.mockResolvedValue(null);
      // act
      await jetstreamService.handleCreateOrUpdate(dummyEvent(did));
      // assert
      expect(await ownerDbRepository.findByDid(asDid(did))).toMatchObject({
        handle: null,
      });
      const { rows } = await pool.query(
        `SELECT * FROM "Board" WHERE "ownerDid" = $1`,
        [did],
      );
      expect(rows).toHaveLength(1);
    });
    test("持ち主の写しが新しくても、ハンドルを解決し直す", async () => {
      // arrange
      const owner = await OwnerFactory.create({ handle: "old.example.com" });
      identityResolver.resolve.mockResolvedValue(
        found(owner.did, "new.example.com"),
      );
      server.use(
        http.get(
          "https://pds.example.com/xrpc/com.atproto.repo.getRecord",
          () => HttpResponse.json("", { status: 500 }),
        ),
      );
      // act
      await jetstreamService.handleCreateOrUpdate(dummyEvent(owner.did));
      // assert
      expect(await ownerDbRepository.findByDid(asDid(owner.did))).toMatchObject(
        {
          handle: "new.example.com",
          displayName: owner.displayName,
        },
      );
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
      expect(await ownerDbRepository.findByDid(asDid(did))).toBeNull();
    });
    test("持ち主の写しがあれば、DIDからハンドルを解決し直して更新する", async () => {
      // arrange
      const owner = await OwnerFactory.create({
        handle: "old.example.com",
        displayName: "表示名",
      });
      identityResolver.resolve.mockResolvedValue(
        found(owner.did, "new.example.com"),
      );
      // act
      await jetstreamService.handleIdentity(
        identityEvent(owner.did, "unverified.example.com"),
      );
      // assert
      expect(identityResolver.resolve).toHaveBeenCalledWith(owner.did, {
        noCache: true,
      });
      const actual = await ownerDbRepository.findByDid(asDid(owner.did));
      expect(actual?.handle).toBe("new.example.com");
      expect(actual?.displayName).toBe("表示名");
    });
    test("解決したハンドルを他の写しが持っていれば、そちらをnullにする", async () => {
      // arrange
      const other = await OwnerFactory.create({ handle: "new.example.com" });
      const owner = await OwnerFactory.create({ handle: "old.example.com" });
      identityResolver.resolve.mockResolvedValue(
        found(owner.did, "new.example.com"),
      );
      // act
      await jetstreamService.handleIdentity(identityEvent(owner.did));
      // assert
      const actual = await ownerDbRepository.findByDid(asDid(owner.did));
      expect(actual?.handle).toBe("new.example.com");
      const otherActual = await ownerDbRepository.findByDid(asDid(other.did));
      expect(otherActual?.handle).toBeNull();
    });
    test("ハンドルの検証に失敗したら、写しのハンドルをnullにする", async () => {
      // arrange
      const owner = await OwnerFactory.create({ handle: "old.example.com" });
      identityResolver.resolve.mockResolvedValue(found(owner.did, null));
      // act
      await jetstreamService.handleIdentity(identityEvent(owner.did));
      // assert
      const actual = await ownerDbRepository.findByDid(asDid(owner.did));
      expect(actual?.handle).toBeNull();
    });
    test("DIDを解決できなければ、写しのハンドルをnullにする", async () => {
      // arrange
      const owner = await OwnerFactory.create({ handle: "old.example.com" });
      identityResolver.resolve.mockResolvedValue(null);
      // act
      await jetstreamService.handleIdentity(identityEvent(owner.did));
      // assert
      const actual = await ownerDbRepository.findByDid(asDid(owner.did));
      expect(actual?.handle).toBeNull();
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
        const owner = await OwnerFactory.create({ status: "deleted" });
        // act
        await jetstreamService.handleAccount(accountEvent(owner.did, account));
        // assert
        const { rows } = await pool.query(
          `SELECT status FROM "Owner" WHERE did = $1`,
          [owner.did],
        );
        expect(rows).toEqual([{ status: expected }]);
      },
    );
  });
});
