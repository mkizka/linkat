import { asDid } from "@atproto/did";

import { User } from "~/models/user";
import { UserFactory } from "~/server/factories/user";

import { userRepository } from "./userRepository";

describe("userRepository", () => {
  describe("findByDid", () => {
    test("保存されていない場合はnullを返す", async () => {
      // arrange
      // act
      const actual = await userRepository.findByDid(asDid("did:plc:notfound"));
      // assert
      expect(actual).toBeNull();
    });
    test("didを指定してユーザーを取得できる", async () => {
      // arrange
      const user = await UserFactory.create();
      // act
      const actual = await userRepository.findByDid(asDid(user.did));
      // assert
      expect(actual).toEqual(user);
    });
  });

  describe("findByHandle", () => {
    test("保存されていない場合はnullを返す", async () => {
      // arrange
      // act
      const actual = await userRepository.findByHandle("notfound.example.com");
      // assert
      expect(actual).toBeNull();
    });
    test("handleを指定してユーザーを取得できる", async () => {
      // arrange
      const user = await UserFactory.create();
      // act
      const actual = await userRepository.findByHandle(user.handle);
      // assert
      expect(actual).toEqual(user);
    });
    test("handleが同じユーザーが複数DBにある場合は、最後に作成された方を取得する", async () => {
      // arrange
      const user1 = await UserFactory.create({
        handle: "example.com",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      });
      const user2 = await UserFactory.create({
        handle: "example.com",
        createdAt: new Date("2024-01-02T00:00:00.000Z"),
      });
      // act
      const actual = await userRepository.findByHandle("example.com");
      // assert
      expect(user1.did).not.toEqual(user2.did);
      expect(actual).toEqual(user2);
    });
  });

  describe("save", () => {
    test("新しいユーザーを保存できる", async () => {
      // arrange
      const user = new User({
        did: "did:plc:abcdefghijklmnopqrstuvwx",
        avatar: "https://example.com/avatar.png",
        description: "description",
        displayName: "display name",
        handle: "example.com",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      });
      // act
      await userRepository.save(user);
      // assert
      const actual = await userRepository.findByDid(user.did);
      expect(actual).toEqual({
        did: user.did,
        avatar: user.avatar,
        description: user.description,
        displayName: user.displayName,
        handle: user.handle,
        createdAt: expect.any(Date),
        updatedAt: user.updatedAt,
      });
    });
    test("既存のユーザーを上書きできる", async () => {
      // arrange
      const existing = await UserFactory.create({
        did: "did:plc:abcdefghijklmnopqrstuvwx",
        handle: "old.example.com",
        avatar: "https://example.com/old-avatar.png",
      });
      const updated = new User({
        did: existing.did,
        avatar: "https://example.com/new-avatar.png",
        description: "new description",
        displayName: "new display name",
        handle: "new.example.com",
        createdAt: existing.createdAt,
        updatedAt: new Date("2024-02-01T00:00:00.000Z"),
      });
      // act
      await userRepository.save(updated);
      // assert
      const actual = await userRepository.findByDid(asDid(existing.did));
      expect(actual).toEqual({
        did: existing.did,
        avatar: updated.avatar,
        description: updated.description,
        displayName: updated.displayName,
        handle: updated.handle,
        createdAt: existing.createdAt,
        updatedAt: updated.updatedAt,
      });
    });
  });
});
