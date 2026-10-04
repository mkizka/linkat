import { asDid } from "@atproto/did";

import { Owner } from "~/models/owner";
import { OwnerFactory } from "~/server/factories/owner";
import { db } from "~/server/infrastructure/drizzle";

import { ownerDbRepositoryFactory } from "./ownerDbRepository";

const ownerDbRepository = ownerDbRepositoryFactory({ db });

describe("ownerDbRepository", () => {
  describe("findByDid", () => {
    test("保存されていない場合はnullを返す", async () => {
      // arrange
      // act
      const actual = await ownerDbRepository.findByDid(
        asDid("did:plc:notfound"),
      );
      // assert
      expect(actual).toBeNull();
    });
    test("didを指定して持ち主の写しを取得できる", async () => {
      // arrange
      const owner = await OwnerFactory.create();
      // act
      const actual = await ownerDbRepository.findByDid(asDid(owner.did));
      // assert
      expect(actual).toEqual(owner);
    });
  });

  describe("save", () => {
    test("新しい持ち主の写しを保存できる", async () => {
      // arrange
      const owner = new Owner({
        did: "did:plc:abcdefghijklmnopqrstuvwx",
        avatar: null,
        avatarCid: "bafkreiavatar",
        description: "description",
        displayName: "display name",
        handle: "example.com",
        status: "active",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      });
      // act
      await ownerDbRepository.save(owner);
      // assert
      const actual = await ownerDbRepository.findByDid(owner.did);
      expect(actual).toEqual({
        did: owner.did,
        avatar: owner.avatar,
        avatarCid: owner.avatarCid,
        description: owner.description,
        displayName: owner.displayName,
        handle: owner.handle,
        status: "active",
        createdAt: expect.any(Date),
        updatedAt: owner.updatedAt,
      });
    });
    test("既存の持ち主の写しを上書きでき、状態は変えない", async () => {
      // arrange
      const existing = await OwnerFactory.create({
        did: "did:plc:abcdefghijklmnopqrstuvwx",
        handle: "old.example.com",
        avatar: "https://example.com/old-avatar.png",
        status: "deactivated",
      });
      const updated = new Owner({
        did: existing.did,
        avatar: null,
        avatarCid: "bafkreinewavatar",
        description: "new description",
        displayName: "new display name",
        handle: "new.example.com",
        status: "active",
        createdAt: existing.createdAt,
        updatedAt: new Date("2024-02-01T00:00:00.000Z"),
      });
      // act
      await ownerDbRepository.save(updated);
      // assert
      const actual = await ownerDbRepository.findByDid(asDid(existing.did));
      expect(actual).toEqual({
        did: existing.did,
        avatar: updated.avatar,
        avatarCid: updated.avatarCid,
        description: updated.description,
        displayName: updated.displayName,
        handle: updated.handle,
        status: "deactivated",
        createdAt: existing.createdAt,
        updatedAt: updated.updatedAt,
      });
    });
    test("他の持ち主が同じhandleを持っている場合、その持ち主のhandleをnullにする", async () => {
      // arrange
      const other = await OwnerFactory.create({ handle: "example.com" });
      // act
      await ownerDbRepository.save(
        new Owner({ ...other, did: "did:plc:abcdefghijklmnopqrstuvwx" }),
      );
      // assert
      const actual = await ownerDbRepository.findByDid(asDid(other.did));
      expect(actual?.handle).toBeNull();
    });
    test("handleがnullの写しは複数保存できる", async () => {
      // arrange
      const other = await OwnerFactory.create({ handle: null });
      // act
      const actual = await ownerDbRepository.save(
        new Owner({ ...other, did: "did:plc:abcdefghijklmnopqrstuvwx" }),
      );
      // assert
      expect(actual.handle).toBeNull();
    });
  });

  describe("updateStatus", () => {
    test("持ち主の写しの状態を更新できる", async () => {
      // arrange
      const existing = await OwnerFactory.create();
      // act
      await ownerDbRepository.updateStatus(asDid(existing.did), "suspended");
      // assert
      const actual = await ownerDbRepository.findByDid(asDid(existing.did));
      expect(actual?.status).toBe("suspended");
    });
    test("持ち主の写しが保存されていない場合は何もしない", async () => {
      // arrange
      const did = asDid("did:plc:notfound");
      // act
      await ownerDbRepository.updateStatus(did, "suspended");
      // assert
      const actual = await ownerDbRepository.findByDid(did);
      expect(actual).toBeNull();
    });
  });
});
