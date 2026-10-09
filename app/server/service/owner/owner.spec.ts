import { asDid } from "@atproto/did";
import { http, HttpResponse } from "msw";
import { mock, mockReset } from "vitest-mock-extended";

import { server } from "~/mocks/server";
import { Owner } from "~/models/owner";
import { OwnerFactory } from "~/server/factories/owner";
import { db } from "~/server/infrastructure/db/drizzle";
import { loggerFactory } from "~/server/infrastructure/logger/logger";
import type { IIdentityResolver } from "~/server/infrastructure/owner/identityResolver";
import { ownerRepositoryFactory } from "~/server/infrastructure/owner/ownerRepository";
import { profileFetcherFactory } from "~/server/infrastructure/owner/profileFetcher";
import { profileRecordParserFactory } from "~/server/infrastructure/owner/profileRecordParser";

import { ownerServiceFactory } from "./owner";

const identityResolver = mock<IIdentityResolver>();
const logger = loggerFactory();
const ownerRepository = ownerRepositoryFactory({ db });
const profileFetcher = profileFetcherFactory({
  profileRecordParser: profileRecordParserFactory(),
  logger,
});

const ownerService = ownerServiceFactory({
  ownerRepository,
  profileFetcher,
  identityResolver,
});

const getRecordUrl = "https://pds.example.com/xrpc/com.atproto.repo.getRecord";

const mockIdentity = (did: string, handle: string | null) =>
  identityResolver.resolve.mockResolvedValue({
    did: asDid(did),
    pds: "https://pds.example.com",
    handle,
  });

beforeEach(() => {
  mockReset(identityResolver);
  identityResolver.resolve.mockResolvedValue(null);
});

describe("ownerService", () => {
  describe("findOwner", () => {
    test("持ち主を取得できる", async () => {
      // arrange
      const owner = await OwnerFactory.create();
      // act
      const actual = await ownerService.findOwner(asDid(owner.did));
      // assert
      expect(actual).toEqual(owner);
    });
    test("写しが古くても、ハンドルを解決せずに写しをそのまま返す", async () => {
      // arrange
      const owner = await OwnerFactory.create({
        updatedAt: new Date("2000-01-01T00:00:00Z"),
      });
      // act
      const actual = await ownerService.findOwner(asDid(owner.did));
      // assert
      expect(actual).toEqual(owner);
      expect(identityResolver.resolve).not.toHaveBeenCalled();
    });
    test("写しに無いDIDはDIDだけの持ち主を返し、写しを作らない", async () => {
      // arrange
      const did = asDid("did:plc:notowner0000000000000000");
      // act
      const actual = await ownerService.findOwner(did);
      // assert
      expect(actual.toView()).toEqual(Owner.create(did).toView());
      expect(identityResolver.resolve).not.toHaveBeenCalled();
      expect(await ownerRepository.findByDid(did)).toBeNull();
    });
  });

  describe("syncOwner", () => {
    test("写しが無ければ、ハンドルを解決しプロフィールを取得して作る", async () => {
      // arrange
      const did = asDid("did:plc:owner");
      mockIdentity(did, "alice.example.com");
      server.use(
        http.get(getRecordUrl, () =>
          HttpResponse.json({
            uri: "at://did:plc:owner/app.bsky.actor.profile/self",
            cid: "bafyreidfayvfuwqa7qlnopdjiqrxzs6blmoeu4rujcjtnci5beludirz2a",
            value: { $type: "app.bsky.actor.profile", displayName: "Alice" },
          }),
        ),
      );
      // act
      const actual = await ownerService.syncOwner(did);
      // assert
      expect(actual).toMatchObject({
        handle: "alice.example.com",
        displayName: "Alice",
      });
      expect(await ownerRepository.findByDid(did)).toEqual(actual);
    });
    test("DIDを解決できなければ、ハンドルをnullにして既存のプロフィールを残す", async () => {
      // arrange
      const owner = await OwnerFactory.create({
        handle: "alice.example.com",
        displayName: "Alice",
      });
      // act
      const actual = await ownerService.syncOwner(asDid(owner.did));
      // assert
      expect(actual).toMatchObject({ handle: null, displayName: "Alice" });
    });
    test("プロフィールを取得できなければ、既存のプロフィールを残してハンドルは更新する", async () => {
      // arrange
      const owner = await OwnerFactory.create({
        handle: "old.example.com",
        displayName: "Alice",
      });
      mockIdentity(owner.did, "alice.example.com");
      server.use(
        http.get(getRecordUrl, () =>
          HttpResponse.json({ error: "InternalServerError" }, { status: 500 }),
        ),
      );
      // act
      const actual = await ownerService.syncOwner(asDid(owner.did));
      // assert
      expect(actual).toMatchObject({
        handle: "alice.example.com",
        displayName: "Alice",
      });
    });
  });

  describe("updateProfile", () => {
    const avatarCid =
      "bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku";
    const profile = {
      avatar: null,
      avatarCid,
      description: "新しい説明",
      displayName: "新しい名前",
    };
    test("写しがあれば、プロフィールを更新しハンドルを解決し直す", async () => {
      // arrange
      const owner = await OwnerFactory.create({
        handle: "old.example.com",
        displayName: "古い名前",
      });
      mockIdentity(owner.did, "new.example.com");
      // act
      const actual = await ownerService.updateProfile(
        asDid(owner.did),
        profile,
      );
      // assert
      expect(actual).toMatchObject({
        handle: "new.example.com",
        displayName: "新しい名前",
        description: "新しい説明",
        avatarCid,
      });
      expect(await ownerRepository.findByDid(asDid(owner.did))).toEqual(actual);
    });
    test("プロフィールがnullなら、プロフィールを空にする", async () => {
      // arrange
      const owner = await OwnerFactory.create({
        displayName: "古い名前",
        description: "古い説明",
        avatarCid,
      });
      mockIdentity(owner.did, owner.handle);
      // act
      const actual = await ownerService.updateProfile(asDid(owner.did), null);
      // assert
      expect(actual).toMatchObject({
        handle: owner.handle,
        displayName: null,
        description: null,
        avatarCid: null,
      });
    });
    test("ハンドルを解決できなければ、ハンドルをnullにしてプロフィールは更新する", async () => {
      // arrange
      const owner = await OwnerFactory.create({ handle: "old.example.com" });
      // act
      const actual = await ownerService.updateProfile(
        asDid(owner.did),
        profile,
      );
      // assert
      expect(actual).toMatchObject({ handle: null, displayName: "新しい名前" });
    });
    test("写しが無ければ、ハンドルを解決せずnullを返す", async () => {
      // arrange
      const did = asDid("did:plc:notowner0000000000000000");
      // act
      const actual = await ownerService.updateProfile(did, profile);
      // assert
      expect(actual).toBeNull();
      expect(identityResolver.resolve).not.toHaveBeenCalled();
      expect(await ownerRepository.findByDid(did)).toBeNull();
    });
  });

  describe("refreshHandle", () => {
    test("写しがあれば、キャッシュを使わずにハンドルを解決し直す", async () => {
      // arrange
      const owner = await OwnerFactory.create({
        handle: "old.example.com",
        displayName: "Alice",
      });
      mockIdentity(owner.did, "new.example.com");
      // act
      const actual = await ownerService.refreshHandle(asDid(owner.did));
      // assert
      expect(identityResolver.resolve).toHaveBeenCalledWith(owner.did, {
        noCache: true,
      });
      expect(actual).toMatchObject({
        handle: "new.example.com",
        displayName: "Alice",
      });
      expect(await ownerRepository.findByDid(asDid(owner.did))).toEqual(actual);
    });
    test("解決したハンドルを他の写しが持っていれば、そちらをnullにする", async () => {
      // arrange
      const other = await OwnerFactory.create({ handle: "new.example.com" });
      const owner = await OwnerFactory.create({ handle: "old.example.com" });
      mockIdentity(owner.did, "new.example.com");
      // act
      await ownerService.refreshHandle(asDid(owner.did));
      // assert
      expect(await ownerRepository.findByDid(asDid(owner.did))).toMatchObject({
        handle: "new.example.com",
      });
      expect(await ownerRepository.findByDid(asDid(other.did))).toMatchObject({
        handle: null,
      });
    });
    test("ハンドルの検証に失敗したら、写しのハンドルをnullにする", async () => {
      // arrange
      const owner = await OwnerFactory.create({ handle: "old.example.com" });
      mockIdentity(owner.did, null);
      // act
      const actual = await ownerService.refreshHandle(asDid(owner.did));
      // assert
      expect(actual?.handle).toBeNull();
    });
    test("DIDを解決できなければ、写しのハンドルをnullにする", async () => {
      // arrange
      const owner = await OwnerFactory.create({ handle: "old.example.com" });
      // act
      const actual = await ownerService.refreshHandle(asDid(owner.did));
      // assert
      expect(actual?.handle).toBeNull();
    });
    test("写しが無ければ、ハンドルを解決せずnullを返す", async () => {
      // arrange
      const did = asDid("did:plc:notowner0000000000000000");
      // act
      const actual = await ownerService.refreshHandle(did);
      // assert
      expect(actual).toBeNull();
      expect(identityResolver.resolve).not.toHaveBeenCalled();
    });
  });
});
