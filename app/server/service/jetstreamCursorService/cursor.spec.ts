import { prisma } from "~/server/service/prisma";

import { jetstreamCursorService } from ".";

describe("jetstreamCursorService", () => {
  beforeEach(async () => {
    await prisma.jetstreamCursor.deleteMany();
  });

  describe("loadCursor", () => {
    test("保存されていない場合はundefinedを返す", async () => {
      // arrange
      // act
      const actual = await jetstreamCursorService.loadCursor();
      // assert
      expect(actual).toBeUndefined();
    });
  });

  describe("saveCursor", () => {
    test("保存したcursorを読み込める", async () => {
      // arrange
      // act
      await jetstreamCursorService.saveCursor(123);
      // assert
      expect(await jetstreamCursorService.loadCursor()).toBe(123);
    });
    test("既存のcursorを上書きできる", async () => {
      // arrange
      await jetstreamCursorService.saveCursor(123);
      // act
      await jetstreamCursorService.saveCursor(456);
      // assert
      expect(await jetstreamCursorService.loadCursor()).toBe(456);
    });
  });
});
