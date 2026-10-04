import { asDid } from "@atproto/did";
import { http, HttpResponse } from "msw";
import { mock, mockReset } from "vitest-mock-extended";

import { server } from "~/mocks/server";
import { Owner } from "~/models/owner";
import { OwnerFactory } from "~/server/factories/owner";
import { db } from "~/server/infrastructure/drizzle";
import { handleIndexFactory } from "~/server/infrastructure/handleIndex";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import { ownerRepositoryFactory } from "~/server/infrastructure/ownerRepository";
import { profileFetcherFactory } from "~/server/infrastructure/profileFetcher";
import { profileRecordParserFactory } from "~/server/infrastructure/profileRecordParser";

import { ownerServiceFactory } from "./owner";

const identityResolver = mock<IIdentityResolver>();
const ownerRepository = ownerRepositoryFactory({ db });
const profileFetcher = profileFetcherFactory({
  profileRecordParser: profileRecordParserFactory(),
});

const ownerService = ownerServiceFactory({
  handleIndex: handleIndexFactory({ db }),
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
      const actual = await ownerService.findOwner({ handleOrDid: owner.did });
      // assert
      expect(actual).toEqual(owner);
    });
    test("handleを指定するとDBの写しからDIDを引いて取得する", async () => {
      // arrange
      const owner = await OwnerFactory.create({ handle: "example.com" });
      // act
      const actual = await ownerService.findOwner({
        handleOrDid: "example.com",
      });
      // assert
      expect(actual).toEqual(owner);
    });
    test("写しが古くても、ハンドルを解決せずに写しをそのまま返す", async () => {
      // arrange
      const owner = await OwnerFactory.create({
        updatedAt: new Date("2000-01-01T00:00:00Z"),
      });
      // act
      const actual = await ownerService.findOwner({ handleOrDid: owner.did });
      // assert
      expect(actual).toEqual(owner);
      expect(identityResolver.resolve).not.toHaveBeenCalled();
    });
    test("写しに無いDIDはDIDだけの持ち主を返し、写しを作らない", async () => {
      // arrange
      const did = asDid("did:plc:notowner0000000000000000");
      // act
      const actual = await ownerService.findOwner({ handleOrDid: did });
      // assert
      expect(actual?.toView()).toEqual(Owner.create(did).toView());
      expect(identityResolver.resolve).not.toHaveBeenCalled();
      expect(await ownerRepository.findByDid(did)).toBeNull();
    });
    test("写しに無いhandleはハンドルを解決せずにnullを返す", async () => {
      // arrange
      // act
      const actual = await ownerService.findOwner({
        handleOrDid: "example.com",
      });
      // assert
      expect(actual).toBeNull();
      expect(identityResolver.resolve).not.toHaveBeenCalled();
    });
    test("入力が明らかにドメインでなければnullを返す", async () => {
      // arrange
      // act
      const actual = await ownerService.findOwner({
        handleOrDid: "invalid",
      });
      // assert
      expect(actual).toBeNull();
    });
    test("入力がDIDとして不正であればnullを返す", async () => {
      // arrange
      // act
      const actual = await ownerService.findOwner({
        handleOrDid: "did:invalid",
      });
      // assert
      expect(actual).toBeNull();
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
});
