import { asDid } from "@atproto/did";

import { User } from "~/models/user";
import { UserFactory } from "~/server/factories/user";
import { db } from "~/server/infrastructure/drizzle";

import { userDbRepositoryFactory } from "./userDbRepository";

const userDbRepository = userDbRepositoryFactory({ db });

describe("userDbRepository", () => {
  describe("findByDid", () => {
    test("保存されていない場合はnullを返す", async () => {
      // arrange
      // act
      const actual = await userDbRepository.findByDid(
        asDid("did:plc:notfound"),
      );
      // assert
      expect(actual).toBeNull();
    });
    test("didを指定してユーザーを取得できる", async () => {
      // arrange
      const user = await UserFactory.create();
      // act
      const actual = await userDbRepository.findByDid(asDid(user.did));
      // assert
      expect(actual).toEqual(user);
    });
  });

  describe("findByHandle", () => {
    test("保存されていない場合はnullを返す", async () => {
      // arrange
      // act
      const actual = await userDbRepository.findByHandle(
        "notfound.example.com",
      );
      // assert
      expect(actual).toBeNull();
    });
    test("handleを指定してユーザーを取得できる", async () => {
      // arrange
      const user = await UserFactory.create({ handle: "example.com" });
      // act
      const actual = await userDbRepository.findByHandle("example.com");
      // assert
      expect(actual).toEqual(user);
    });
  });

  describe("save", () => {
    test("新しいユーザーを保存できる", async () => {
      // arrange
      const user = new User({
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
      await userDbRepository.save(user);
      // assert
      const actual = await userDbRepository.findByDid(user.did);
      expect(actual).toEqual({
        did: user.did,
        avatar: user.avatar,
        avatarCid: user.avatarCid,
        description: user.description,
        displayName: user.displayName,
        handle: user.handle,
        status: "active",
        createdAt: expect.any(Date),
        updatedAt: user.updatedAt,
      });
    });
    test("既存のユーザーを上書きでき、状態は変えない", async () => {
      // arrange
      const existing = await UserFactory.create({
        did: "did:plc:abcdefghijklmnopqrstuvwx",
        handle: "old.example.com",
        avatar: "https://example.com/old-avatar.png",
        status: "deactivated",
      });
      const updated = new User({
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
      await userDbRepository.save(updated);
      // assert
      const actual = await userDbRepository.findByDid(asDid(existing.did));
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
    test("他のユーザーが同じhandleを持っている場合、そのユーザーのhandleをnullにする", async () => {
      // arrange
      const other = await UserFactory.create({ handle: "example.com" });
      // act
      await userDbRepository.save(
        new User({ ...other, did: "did:plc:abcdefghijklmnopqrstuvwx" }),
      );
      // assert
      const actual = await userDbRepository.findByDid(asDid(other.did));
      expect(actual?.handle).toBeNull();
    });
    test("handleがnullのユーザーは複数保存できる", async () => {
      // arrange
      const other = await UserFactory.create({ handle: null });
      // act
      const actual = await userDbRepository.save(
        new User({ ...other, did: "did:plc:abcdefghijklmnopqrstuvwx" }),
      );
      // assert
      expect(actual.handle).toBeNull();
    });
  });

  describe("updateStatus", () => {
    test("ユーザーの状態を更新できる", async () => {
      // arrange
      const existing = await UserFactory.create();
      // act
      await userDbRepository.updateStatus(asDid(existing.did), "suspended");
      // assert
      const actual = await userDbRepository.findByDid(asDid(existing.did));
      expect(actual?.status).toBe("suspended");
    });
    test("ユーザーが保存されていない場合は何もしない", async () => {
      // arrange
      const did = asDid("did:plc:notfound");
      // act
      await userDbRepository.updateStatus(did, "suspended");
      // assert
      const actual = await userDbRepository.findByDid(did);
      expect(actual).toBeNull();
    });
  });
});
