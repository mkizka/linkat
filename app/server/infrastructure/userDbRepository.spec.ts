import { asDid } from "@atproto/did";

import { User } from "~/models/user";
import { BoardFactory } from "~/server/factories/board";
import { UserFactory } from "~/server/factories/user";
import { db } from "~/server/infrastructure/drizzle";

import { userDbRepositoryFactory } from "./userDbRepository";

const userDbRepository = userDbRepositoryFactory({ db });

const dummyUser = (overrides: Partial<User> = {}) =>
  new User({
    did: "did:plc:abcdefghijklmnopqrstuvwx",
    avatar: "https://example.com/avatar.png",
    description: "description",
    displayName: "display name",
    handle: "example.com",
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-02T00:00:00.000Z"),
    ...overrides,
  });

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

  describe("saveIfBoardExists", () => {
    test("ボードがあれば新しいユーザーを保存できる", async () => {
      // arrange
      const user = dummyUser();
      await BoardFactory.create({ userDid: user.did });
      // act
      const actual = await userDbRepository.saveIfBoardExists(user);
      // assert
      const expected = {
        did: user.did,
        avatar: user.avatar,
        description: user.description,
        displayName: user.displayName,
        handle: user.handle,
        createdAt: expect.any(Date),
        updatedAt: user.updatedAt,
      };
      expect(actual).toEqual(expected);
      expect(await userDbRepository.findByDid(user.did)).toEqual(expected);
    });
    test("ボードがあれば既存のユーザーを上書きできる", async () => {
      // arrange
      const existing = await UserFactory.create({
        did: "did:plc:abcdefghijklmnopqrstuvwx",
        handle: "old.example.com",
        avatar: "https://example.com/old-avatar.png",
      });
      await BoardFactory.create({ userDid: existing.did });
      const updated = dummyUser({
        handle: "new.example.com",
        createdAt: existing.createdAt,
        updatedAt: new Date("2024-02-01T00:00:00.000Z"),
      });
      // act
      await userDbRepository.saveIfBoardExists(updated);
      // assert
      const actual = await userDbRepository.findByDid(asDid(existing.did));
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
    test("ボードがなければ保存せずnullを返す", async () => {
      // arrange
      const user = dummyUser();
      // act
      const actual = await userDbRepository.saveIfBoardExists(user);
      // assert
      expect(actual).toBeNull();
      expect(await userDbRepository.findByDid(user.did)).toBeNull();
    });
  });
});
