import { asDid } from "@atproto/did";
import type { CommitDeleteEvent, CommitUpdateEvent } from "@skyware/jetstream";
import { CommitType, EventType } from "@skyware/jetstream";
import { http, HttpResponse } from "msw";
import { Pool } from "pg";
import { mock, mockReset } from "vitest-mock-extended";

import { server } from "~/mocks/server";
import { OwnerFactory } from "~/server/factories/owner";
import type { IBoardPdsRepository } from "~/server/infrastructure/board/boardPdsRepository";
import { boardRepositoryFactory } from "~/server/infrastructure/board/boardRepository";
import { db } from "~/server/infrastructure/db/drizzle";
import { cursorRepositoryFactory } from "~/server/infrastructure/jetstream/cursorRepository";
import { loggerFactory } from "~/server/infrastructure/logger/logger";
import type { IIdentityResolver } from "~/server/infrastructure/owner/identityResolver";
import { ownerRepositoryFactory } from "~/server/infrastructure/owner/ownerRepository";
import { profileFetcherFactory } from "~/server/infrastructure/owner/profileFetcher";
import { profileRecordParserFactory } from "~/server/infrastructure/owner/profileRecordParser";
import { boardEventServiceFactory } from "~/server/service/board/boardEvent";
import { ownerServiceFactory } from "~/server/service/owner/owner";
import { env } from "~/utils/env";

import { jetstreamServiceFactory } from "./jetstream";

const identityResolver = mock<IIdentityResolver>();
const logger = loggerFactory();
const ownerRepository = ownerRepositoryFactory({ db });
const profileRecordParser = profileRecordParserFactory();
const profileFetcher = profileFetcherFactory({
  profileRecordParser,
  logger,
});

const ownerService = ownerServiceFactory({
  ownerRepository,
  profileFetcher,
  identityResolver,
});

const jetstreamService = jetstreamServiceFactory({
  cursorRepository: cursorRepositoryFactory({ db }),
  boardEventService: boardEventServiceFactory({
    boardRepository: boardRepositoryFactory({ db }),
    boardPdsRepository: mock<IBoardPdsRepository>(),
    ownerRepository,
    ownerService,
  }),
  ownerService,
  profileRecordParser,
  logger,
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
      const actual = await ownerRepository.findByDid(asDid(owner.did));
      expect(actual).toMatchObject({
        handle: "new.example.com",
        displayName: "新しい名前",
        description: "新しい説明",
        avatarCid,
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
      const actual = await ownerRepository.findByDid(asDid(owner.did));
      expect(actual).toMatchObject({
        handle: owner.handle,
        displayName: null,
        description: null,
        avatarCid: null,
      });
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
      const actual = await ownerRepository.findByDid(asDid(owner.did));
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
      const actual = await ownerRepository.findByDid(asDid(owner.did));
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
      expect(await ownerRepository.findByDid(asDid(did))).toMatchObject({
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
      expect(await ownerRepository.findByDid(asDid(owner.did))).toMatchObject({
        handle: "new.example.com",
        displayName: owner.displayName,
      });
    });
  });

  describe("handleIdentity", () => {
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
      const actual = await ownerRepository.findByDid(asDid(owner.did));
      expect(actual?.handle).toBe("new.example.com");
      expect(actual?.displayName).toBe("表示名");
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
      account
      ${{ active: false, status: "takendown" }}
      ${{ active: false, status: "deactivated" }}
      ${{ active: false, status: "throttled" }}
      ${{ active: false, status: "unknown-future-status" }}
      ${{ active: false }}
      ${{ active: true }}
    `(
      "$account をそのまま記録する",
      async ({
        account,
      }: {
        account: { active: boolean; status?: string };
      }) => {
        // arrange
        const owner = await OwnerFactory.create({
          active: false,
          status: "deleted",
        });
        // act
        await jetstreamService.handleAccount(accountEvent(owner.did, account));
        // assert
        const { rows } = await pool.query(
          `SELECT active, status FROM "Owner" WHERE did = $1`,
          [owner.did],
        );
        expect(rows).toEqual([
          { active: account.active, status: account.status ?? null },
        ]);
      },
    );
  });
});
