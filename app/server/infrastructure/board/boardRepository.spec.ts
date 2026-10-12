import { asDid } from "@atproto/did";
import { Pool } from "pg";

import { Board } from "~/models/board";
import { BoardFactory, cardsFromFactory } from "~/server/factories/board";
import { OwnerFactory } from "~/server/factories/owner";
import { db } from "~/server/infrastructure/db/drizzle";
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
      const owner = await OwnerFactory.create();
      // act
      const actual = await boardRepository.find(asDid(owner.did));
      // assert
      expect(actual).toBeNull();
    });
    test("ボードが存在する場合はBoardを返す", async () => {
      // arrange
      const board = await BoardFactory.create();
      // act
      const actual = await boardRepository.find(asDid(board.ownerDid));
      // assert
      expect(actual).toEqual(new Board(board.ownerDid, cardsFromFactory));
    });
  });

  describe("save", () => {
    test("ボードが存在しない場合は新規作成する", async () => {
      // arrange
      const owner = await OwnerFactory.create();
      const board = new Board(owner.did, [
        { url: "https://example.com", text: "新規カード" },
      ]);
      // act
      await boardRepository.save(board);
      // assert
      const actual = await boardRepository.find(asDid(owner.did));
      expect(actual).toEqual(board);
    });
    test("ボードが存在する場合は上書きする", async () => {
      // arrange
      const existing = await BoardFactory.create();
      const updated = new Board(existing.ownerDid, [
        { url: "https://example.com", text: "更新後のカード" },
      ]);
      // act
      await boardRepository.save(updated);
      // assert
      const actual = await boardRepository.find(asDid(existing.ownerDid));
      expect(actual).toEqual(updated);
      const { rows } = await pool.query(
        `SELECT id FROM "Board" WHERE "ownerDid" = $1`,
        [existing.ownerDid],
      );
      expect(rows).toHaveLength(1);
    });
  });

  describe("delete", () => {
    test("ボードを削除できる", async () => {
      // arrange
      const board = await BoardFactory.create();
      // act
      await boardRepository.delete(asDid(board.ownerDid));
      // assert
      expect(await boardRepository.find(asDid(board.ownerDid))).toBeNull();
    });
    test("ボードが存在しなくてもエラーにならない", async () => {
      // arrange
      const owner = await OwnerFactory.create();
      // act
      const actual = boardRepository.delete(asDid(owner.did));
      // assert
      await expect(actual).resolves.not.toThrow();
    });
  });
});
