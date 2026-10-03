import { asDid } from "@atproto/did";
import type { CommitDeleteEvent, CommitUpdateEvent } from "@skyware/jetstream";
import { CommitType, EventType } from "@skyware/jetstream";
import { Pool } from "pg";
import { mock, mockReset } from "vitest-mock-extended";

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
    userDbRepository,
    identityResolver,
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

describe("jetstreamService", () => {
  beforeEach(() => {
    mockReset(identityResolver);
  });

  describe("handleProfileCommit", () => {
    test("持ち主の写しがあれば、レコードの値でプロフィールを更新し、ハンドルを解決し直す", async () => {
      // arrange
      const user = await UserFactory.create({
        handle: "old.example.com",
        displayName: "古い名前",
      });
      identityResolver.resolve.mockResolvedValue({
        did: asDid(user.did),
        pds: "https://pds.example.com",
        handle: "new.example.com",
      });
      // act
      await jetstreamService.handleProfileCommit(
        profileUpdateEvent(user.did, profileRecord),
      );
      // assert
      const actual = await userDbRepository.findByDid(asDid(user.did));
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
      const user = await UserFactory.create({
        displayName: "古い名前",
        description: "古い説明",
        avatarCid,
      });
      identityResolver.resolve.mockResolvedValue({
        did: asDid(user.did),
        pds: "https://pds.example.com",
        handle: user.handle,
      });
      // act
      await jetstreamService.handleProfileCommit(profileDeleteEvent(user.did));
      // assert
      const actual = await userDbRepository.findByDid(asDid(user.did));
      expect(actual).toMatchObject({
        handle: user.handle,
        displayName: null,
        description: null,
        avatarCid: null,
      });
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
      expect(await userDbRepository.findByDid(asDid(did))).toBeNull();
    });
    test("レコードが不正な場合、既存の値を残す", async () => {
      // arrange
      const user = await UserFactory.create({ displayName: "古い名前" });
      // act
      await jetstreamService.handleProfileCommit(
        profileUpdateEvent(user.did, {
          $type: "app.bsky.actor.profile",
          displayName: "あ".repeat(65),
        }),
      );
      // assert
      expect(identityResolver.resolve).not.toHaveBeenCalled();
      const actual = await userDbRepository.findByDid(asDid(user.did));
      expect(actual).toEqual(user);
    });
    test("rkeyがself以外のレコードは無視する", async () => {
      // arrange
      const user = await UserFactory.create({ displayName: "古い名前" });
      // act
      await jetstreamService.handleProfileCommit(
        profileUpdateEvent(user.did, profileRecord, "other"),
      );
      // assert
      const actual = await userDbRepository.findByDid(asDid(user.did));
      expect(actual).toEqual(user);
    });
  });

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
});
