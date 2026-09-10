import type { ValidBoard } from "~/models/board";
import { BoardFactory, cardsFromFactory } from "~/server/factories/board";
import { UserFactory } from "~/server/factories/user";
import { prisma } from "~/server/service/prisma";

import { boardService } from ".";

const dummyBoard = {
  cards: [
    {
      url: "https://example.com",
      text: "board.spec.tsのカード",
    },
  ],
} satisfies ValidBoard;

describe("boardService", () => {
  describe("createBoard", () => {
    test("ボードがない場合は新規作成する", async () => {
      // arrange
      const user = await UserFactory.create(); // findOrFetchUserが作成するユーザー
      // act
      const actual = await boardService.createOrUpdateBoard({
        userDid: user.did,
        board: dummyBoard,
      });
      // assert
      expect(await prisma.user.findFirst()).toEqual(user);
      expect(actual).toEqual(dummyBoard);
    });
    test("既存のボードがある場合は更新する", async () => {
      // arrange
      const board = await BoardFactory.create();
      // act
      const actual = await boardService.createOrUpdateBoard({
        userDid: board.userDid,
        board: dummyBoard,
      });
      // assert
      expect(await prisma.user.findFirst()).toMatchObject({
        did: board.userDid,
      });
      expect(actual).not.toEqual(board);
      expect(actual).toEqual(dummyBoard);
    });
  });
  describe("findBoard", () => {
    test("既存のボードがある場合はそのまま返す", async () => {
      // arrange
      const board = await BoardFactory.create();
      // act
      const actual = await boardService.findBoard(board.userDid);
      // assert
      expect(actual).toEqual({ cards: cardsFromFactory });
    });
    test("DBにboardが無ければnullを返す", async () => {
      // arrange
      const user = await UserFactory.create();
      // act
      const actual = await boardService.findBoard(user.did);
      // assert
      expect(actual).toBeNull();
    });
  });
});
