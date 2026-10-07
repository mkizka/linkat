import { asDid } from "@atproto/did";

import { Owner } from "~/models/owner";
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

  describe("save", () => {
    test("新しい持ち主を保存できる", async () => {
      // arrange
      const owner = new Owner({
        did: "did:plc:abcdefghijklmnopqrstuvwx",
        avatarCid: "bafkreiavatar",
        description: "description",
        displayName: "display name",
        handle: "example.com",
        active: true,
        status: null,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      });
      // act
      await ownerRepository.save(owner);
      // assert
      const actual = await ownerRepository.findByDid(owner.did);
      expect(actual).toEqual({
        did: owner.did,
        avatarCid: owner.avatarCid,
        description: owner.description,
        displayName: owner.displayName,
        handle: owner.handle,
        active: true,
        status: null,
        createdAt: expect.any(Date),
        updatedAt: owner.updatedAt,
      });
    });
    test("既存の持ち主を上書きでき、状態は変えない", async () => {
      // arrange
      const existing = await OwnerFactory.create({
        did: "did:plc:abcdefghijklmnopqrstuvwx",
        handle: "old.example.com",
        active: false,
        status: "deactivated",
      });
      const updated = new Owner({
        did: existing.did,
        avatarCid: "bafkreinewavatar",
        description: "new description",
        displayName: "new display name",
        handle: "new.example.com",
        active: true,
        status: null,
        createdAt: existing.createdAt,
        updatedAt: new Date("2024-02-01T00:00:00.000Z"),
      });
      // act
      await ownerRepository.save(updated);
      // assert
      const actual = await ownerRepository.findByDid(asDid(existing.did));
      expect(actual).toEqual({
        did: existing.did,
        avatarCid: updated.avatarCid,
        description: updated.description,
        displayName: updated.displayName,
        handle: updated.handle,
        active: false,
        status: "deactivated",
        createdAt: existing.createdAt,
        updatedAt: updated.updatedAt,
      });
    });
    test("他の持ち主が同じhandleを持っている場合、その持ち主のhandleをnullにする", async () => {
      // arrange
      const other = await OwnerFactory.create({ handle: "example.com" });
      // act
      await ownerRepository.save(
        new Owner({ ...other, did: "did:plc:abcdefghijklmnopqrstuvwx" }),
      );
      // assert
      const actual = await ownerRepository.findByDid(asDid(other.did));
      expect(actual?.handle).toBeNull();
    });
    test("handleがnullの持ち主は複数保存できる", async () => {
      // arrange
      const other = await OwnerFactory.create({ handle: null });
      // act
      const actual = await ownerRepository.save(
        new Owner({ ...other, did: "did:plc:abcdefghijklmnopqrstuvwx" }),
      );
      // assert
      expect(actual.handle).toBeNull();
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
