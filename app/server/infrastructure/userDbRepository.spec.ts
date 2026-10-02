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
        avatar: null,
        avatarCid: "bafkreinewavatar",
        description: "new description",
        displayName: "new display name",
        handle: "new.example.com",
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
        createdAt: existing.createdAt,
        updatedAt: updated.updatedAt,
      });
    });
  });
});
