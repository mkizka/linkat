import { prisma } from "~/server/service/prisma";

import { cursorRepository } from "./cursorRepository";

describe("cursorRepository", () => {
  beforeEach(async () => {
    await prisma.jetstreamCursor.deleteMany();
  });

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
