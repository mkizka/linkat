import { asDid } from "@atproto/did";
import { http, HttpResponse } from "msw";
import { mock, mockReset } from "vitest-mock-extended";

import { server } from "~/mocks/server";
import { OwnerFactory } from "~/server/factories/owner";
import { db } from "~/server/infrastructure/db/drizzle";
import { loggerFactory } from "~/server/infrastructure/logger/logger";
import type { IIdentityResolver } from "~/server/infrastructure/owner/identityResolver";
import { ownerRepositoryFactory } from "~/server/infrastructure/owner/ownerRepository";
import { profileFetcherFactory } from "~/server/infrastructure/owner/profileFetcher";
import { profileRecordParserFactory } from "~/server/infrastructure/owner/profileRecordParser";

import { ownerServiceFactory } from "./owner";
import { ownerViewServiceFactory } from "./ownerView";

const identityResolver = mock<IIdentityResolver>();
const logger = loggerFactory();
const ownerRepository = ownerRepositoryFactory({ db });
const profileFetcher = profileFetcherFactory({
  profileRecordParser: profileRecordParserFactory(),
  logger,
});

const ownerViewService = ownerViewServiceFactory();

const ownerService = ownerServiceFactory({
  ownerRepository,
  profileFetcher,
  identityResolver,
  ownerViewService,
});

const getRecordUrl = "https://pds.example.com/xrpc/com.atproto.repo.getRecord";

const identity = (handle: string | null) => ({
  pds: "https://pds.example.com",
  handle,
});

const mockIdentity = (handle: string | null) =>
  identityResolver.resolve.mockResolvedValue(identity(handle));

beforeEach(() => {
  mockReset(identityResolver);
  identityResolver.resolve.mockResolvedValue(null);
});

describe("ownerService", () => {
  describe("findEditorView", () => {
    test("写しが古くても、ハンドルを解決せずに写しの表示用データを返す", async () => {
      // arrange
      const owner = await OwnerFactory.create({
        updatedAt: new Date("2000-01-01T00:00:00Z"),
      });
      // act
      const actual = await ownerService.findEditorView(asDid(owner.did));
      // assert
      expect(actual).toMatchObject({ handleOrDid: owner.handle, synced: true });
      expect(identityResolver.resolve).not.toHaveBeenCalled();
    });
    test("写しに無いDIDは同期前としてDIDだけの表示用データを返し、写しを作らない", async () => {
      // arrange
      const did = asDid("did:plc:notowner0000000000000000");
      // act
      const actual = await ownerService.findEditorView(did);
      // assert
      expect(actual).toEqual({
        did: "did:plc:notowner0000000000000000",
        handleOrDid: "did:plc:notowner0000000000000000",
        displayHandle: null,
        displayName: null,
        avatarUrl: null,
        synced: false,
      });
      expect(identityResolver.resolve).not.toHaveBeenCalled();
      expect(await ownerRepository.findByDid(did)).toBeNull();
    });
  });

  describe("syncOwner", () => {
    test("写しが無ければ、解決結果のハンドルとPDSから取得したプロフィールで作る", async () => {
      // arrange
      const did = asDid("did:plc:owner");
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
      const actual = await ownerService.syncOwner(
        did,
        identity("alice.example.com"),
      );
      // assert
      expect(actual).toMatchObject({
        handle: "alice.example.com",
        displayName: "Alice",
      });
      expect(await ownerRepository.findByDid(did)).toEqual(actual);
    });
    test("解決結果が無ければ、ハンドルをnullにして既存のプロフィールを残す", async () => {
      // arrange
      const owner = await OwnerFactory.create({
        handle: "alice.example.com",
        displayName: "Alice",
      });
      // act
      const actual = await ownerService.syncOwner(asDid(owner.did), null);
      // assert
      expect(actual).toMatchObject({ handle: null, displayName: "Alice" });
    });
    test("プロフィールを取得できなければ、既存のプロフィールを残してハンドルは更新する", async () => {
      // arrange
      const owner = await OwnerFactory.create({
        handle: "old.example.com",
        displayName: "Alice",
      });
      server.use(
        http.get(getRecordUrl, () =>
          HttpResponse.json({ error: "InternalServerError" }, { status: 500 }),
        ),
      );
      // act
      const actual = await ownerService.syncOwner(
        asDid(owner.did),
        identity("alice.example.com"),
      );
      // assert
      expect(actual).toMatchObject({
        handle: "alice.example.com",
        displayName: "Alice",
      });
    });
    test("プロフィールのレコードが無ければ、プロフィールを空にする", async () => {
      // arrange
      const owner = await OwnerFactory.create({ displayName: "Alice" });
      server.use(
        http.get(getRecordUrl, () =>
          HttpResponse.json(
            { error: "RecordNotFound", message: "Could not locate record" },
            { status: 400 },
          ),
        ),
      );
      // act
      const actual = await ownerService.syncOwner(
        asDid(owner.did),
        identity("alice.example.com"),
      );
      // assert
      expect(actual).toMatchObject({
        handle: "alice.example.com",
        displayName: null,
        description: null,
        avatarCid: null,
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
      mockIdentity("new.example.com");
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
      mockIdentity(owner.handle);
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
      mockIdentity("new.example.com");
      // act
      const actual = await ownerService.refreshHandle(asDid(owner.did));
      // assert
      expect(identityResolver.resolve).toHaveBeenCalledWith(owner.did, {
        fresh: true,
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
      mockIdentity("new.example.com");
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
      mockIdentity(null);
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
