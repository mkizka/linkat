import { asDid } from "@atproto/did";

import { OwnerFactory } from "~/server/factories/owner";
import { db } from "~/server/infrastructure/drizzle";

import { ownerRepositoryFactory } from "./ownerRepository";

const ownerRepository = ownerRepositoryFactory({ db });

describe("ownerRepository", () => {
  describe("findByDid", () => {
    test("保存されていない場合はnullを返す", async () => {
      // arrange
      // act
      const actual = await ownerRepository.findByDid(asDid("did:plc:notfound"));
      // assert
      expect(actual).toBeNull();
    });
    test("didを指定して持ち主を取得できる", async () => {
      // arrange
      const owner = await OwnerFactory.create();
      // act
      const actual = await ownerRepository.findByDid(asDid(owner.did));
      // assert
      expect(actual).toEqual(owner);
    });
  });

  describe("upsert", () => {
    const did = asDid("did:plc:abcdefghijklmnopqrstuvwx");
    const profile = {
      avatarCid: "bafkreiavatar",
      description: "description",
      displayName: "display name",
    };

    test("新しい持ち主を作れる", async () => {
      // arrange
      // act
      const actual = await ownerRepository.upsert(did, {
        handle: "example.com",
        profile,
      });
      // assert
      expect(actual).toEqual({
        did,
        ...profile,
        handle: "example.com",
        active: true,
        status: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(await ownerRepository.findByDid(did)).toEqual(actual);
    });
    test("既存の持ち主のプロフィールとハンドルを上書きし、状態は変えない", async () => {
      // arrange
      await OwnerFactory.create({
        did,
        handle: "old.example.com",
        active: false,
        status: "deactivated",
      });
      // act
      const actual = await ownerRepository.upsert(did, {
        handle: "new.example.com",
        profile,
      });
      // assert
      expect(actual).toMatchObject({
        ...profile,
        handle: "new.example.com",
        active: false,
        status: "deactivated",
      });
    });
    test("profileがnullなら、既存のプロフィールを残す", async () => {
      // arrange
      await OwnerFactory.create({ did, displayName: "Alice" });
      // act
      const actual = await ownerRepository.upsert(did, {
        handle: "example.com",
        profile: null,
      });
      // assert
      expect(actual).toMatchObject({
        displayName: "Alice",
        handle: "example.com",
      });
    });
    test("他の持ち主が同じhandleを持っている場合、その持ち主のhandleをnullにする", async () => {
      // arrange
      const other = await OwnerFactory.create({ handle: "example.com" });
      // act
      await ownerRepository.upsert(did, { handle: "example.com", profile });
      // assert
      const actual = await ownerRepository.findByDid(asDid(other.did));
      expect(actual?.handle).toBeNull();
    });
    test("handleがnullの持ち主は複数保存できる", async () => {
      // arrange
      await OwnerFactory.create({ handle: null });
      // act
      const actual = await ownerRepository.upsert(did, {
        handle: null,
        profile,
      });
      // assert
      expect(actual.handle).toBeNull();
    });
  });

  describe("updateProfile", () => {
    test("既存の持ち主のプロフィールとハンドルを更新し、状態は変えない", async () => {
      // arrange
      const existing = await OwnerFactory.create({
        handle: "old.example.com",
        active: false,
        status: "deactivated",
      });
      // act
      const actual = await ownerRepository.updateProfile(asDid(existing.did), {
        handle: "new.example.com",
        profile: {
          avatarCid: "bafkreinewavatar",
          description: "new description",
          displayName: "new display name",
        },
      });
      // assert
      expect(actual).toMatchObject({
        avatarCid: "bafkreinewavatar",
        description: "new description",
        displayName: "new display name",
        handle: "new.example.com",
        active: false,
        status: "deactivated",
      });
    });
    test("profileがnullなら、プロフィールを空にする", async () => {
      // arrange
      const existing = await OwnerFactory.create({ displayName: "Alice" });
      // act
      const actual = await ownerRepository.updateProfile(asDid(existing.did), {
        handle: null,
        profile: null,
      });
      // assert
      expect(actual).toMatchObject({
        avatarCid: null,
        description: null,
        displayName: null,
      });
    });
    test("持ち主が保存されていない場合は何もせずnullを返す", async () => {
      // arrange
      const did = asDid("did:plc:notfound");
      // act
      const actual = await ownerRepository.updateProfile(did, {
        handle: "example.com",
        profile: null,
      });
      // assert
      expect(actual).toBeNull();
      expect(await ownerRepository.findByDid(did)).toBeNull();
    });
  });

  describe("updateHandle", () => {
    test("既存の持ち主のハンドルだけを更新する", async () => {
      // arrange
      const existing = await OwnerFactory.create({
        handle: "old.example.com",
        displayName: "Alice",
      });
      // act
      const actual = await ownerRepository.updateHandle(
        asDid(existing.did),
        "new.example.com",
      );
      // assert
      expect(actual).toMatchObject({
        handle: "new.example.com",
        displayName: "Alice",
      });
    });
    test("他の持ち主が同じhandleを持っている場合、その持ち主のhandleをnullにする", async () => {
      // arrange
      const other = await OwnerFactory.create({ handle: "example.com" });
      const existing = await OwnerFactory.create({ handle: null });
      // act
      await ownerRepository.updateHandle(asDid(existing.did), "example.com");
      // assert
      const actual = await ownerRepository.findByDid(asDid(other.did));
      expect(actual?.handle).toBeNull();
    });
    test("持ち主が保存されていない場合は何もせずnullを返す", async () => {
      // arrange
      const did = asDid("did:plc:notfound");
      // act
      const actual = await ownerRepository.updateHandle(did, "example.com");
      // assert
      expect(actual).toBeNull();
    });
  });

  describe("updateAccountState", () => {
    test("持ち主の状態を更新できる", async () => {
      // arrange
      const existing = await OwnerFactory.create();
      // act
      await ownerRepository.updateAccountState(asDid(existing.did), {
        active: false,
        status: "suspended",
      });
      // assert
      const actual = await ownerRepository.findByDid(asDid(existing.did));
      expect(actual).toMatchObject({ active: false, status: "suspended" });
    });
    test("持ち主が保存されていない場合は何もしない", async () => {
      // arrange
      const did = asDid("did:plc:notfound");
      // act
      await ownerRepository.updateAccountState(did, {
        active: false,
        status: "suspended",
      });
      // assert
      const actual = await ownerRepository.findByDid(did);
      expect(actual).toBeNull();
    });
  });
});
