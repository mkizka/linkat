import { prisma } from "~/server/service/prisma";

import { jetstreamCursorRepository } from "./jetstreamCursorRepository";

describe("jetstreamCursorRepository", () => {
  beforeEach(async () => {
    await prisma.jetstreamCursor.deleteMany();
  });

  describe("load", () => {
    test("保存されていない場合はundefinedを返す", async () => {
      // arrange
      // act
      const actual = await jetstreamCursorRepository.load();
      // assert
      expect(actual).toBeUndefined();
    });
  });

  describe("save", () => {
    test("保存したcursorを読み込める", async () => {
      // arrange
      // act
      await jetstreamCursorRepository.save(123);
      // assert
      expect(await jetstreamCursorRepository.load()).toBe(123);
    });
    test("既存のcursorを上書きできる", async () => {
      // arrange
      await jetstreamCursorRepository.save(123);
      // act
      await jetstreamCursorRepository.save(456);
      // assert
      expect(await jetstreamCursorRepository.load()).toBe(456);
    });
  });
});
