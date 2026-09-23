import { asDid } from "@atproto/did";
import { Pool } from "pg";

import { Board } from "~/models/board";
import { BoardFactory, cardsFromFactory } from "~/server/factories/board";
import { UserFactory } from "~/server/factories/user";
import { db } from "~/server/infrastructure/drizzle";
import { env } from "~/utils/env";

import { boardRepositoryFactory } from "./boardRepository";

const pool = new Pool({ connectionString: env.DATABASE_URL });

afterAll(async () => {
  await pool.end();
});

const boardRepository = boardRepositoryFactory({ db });

describe("boardRepository", () => {
  describe("find", () => {
    test("ボードが存在しない場合はnullを返す", async () => {
      // arrange
      const user = await UserFactory.create();
      // act
      const actual = await boardRepository.find(asDid(user.did));
      // assert
      expect(actual).toBeNull();
    });
    test("ボードが存在する場合はBoardを返す", async () => {
      // arrange
      const board = await BoardFactory.create();
      // act
      const actual = await boardRepository.find(asDid(board.userDid));
      // assert
      expect(actual).toEqual(new Board(board.userDid, cardsFromFactory));
    });
  });

  describe("save", () => {
    test("ボードが存在しない場合は新規作成する", async () => {
      // arrange
      const user = await UserFactory.create();
      const board = new Board(user.did, [
        { url: "https://example.com", text: "新規カード" },
      ]);
      // act
      await boardRepository.save(board);
      // assert
      const actual = await boardRepository.find(asDid(user.did));
      expect(actual).toEqual(board);
    });
    test("ボードが存在する場合は上書きする", async () => {
      // arrange
      const existing = await BoardFactory.create();
      const updated = new Board(existing.userDid, [
        { url: "https://example.com", text: "更新後のカード" },
      ]);
      // act
      await boardRepository.save(updated);
      // assert
      const actual = await boardRepository.find(asDid(existing.userDid));
      expect(actual).toEqual(updated);
      const { rows } = await pool.query(
        `SELECT id FROM "Board" WHERE "userDid" = $1`,
        [existing.userDid],
      );
      expect(rows).toHaveLength(1);
    });
  });

  describe("delete", () => {
    test("ボードを削除できる", async () => {
      // arrange
      const board = await BoardFactory.create();
      // act
      await boardRepository.delete(asDid(board.userDid));
      // assert
      expect(await boardRepository.find(asDid(board.userDid))).toBeNull();
    });
    test("ボードが存在しなくてもエラーにならない", async () => {
      // arrange
      const user = await UserFactory.create();
      // act
      const actual = boardRepository.delete(asDid(user.did));
      // assert
      await expect(actual).resolves.not.toThrow();
    });
  });
});
