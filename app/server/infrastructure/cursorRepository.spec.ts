import { Pool } from "pg";

import { env } from "~/utils/env";

import { cursorRepository } from "./cursorRepository";

const pool = new Pool({ connectionString: env.DATABASE_URL });

describe("cursorRepository", () => {
  beforeEach(async () => {
    await pool.query(
      `TRUNCATE TABLE "JetstreamCursor" RESTART IDENTITY CASCADE;`,
    );
  });

  afterAll(() => pool.end());

  describe("load", () => {
    test("保存されていない場合はundefinedを返す", async () => {
      // arrange
      // act
      const actual = await cursorRepository.load();
      // assert
      expect(actual).toBeUndefined();
    });
  });

  describe("save", () => {
    test("保存したcursorを読み込める", async () => {
      // arrange
      // act
      await cursorRepository.save(123);
      // assert
      expect(await cursorRepository.load()).toBe(123);
    });
    test("既存のcursorを上書きできる", async () => {
      // arrange
      await cursorRepository.save(123);
      // act
      await cursorRepository.save(456);
      // assert
      expect(await cursorRepository.load()).toBe(456);
    });
  });
});
