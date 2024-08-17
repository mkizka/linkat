import { UserFactory } from "~/.server/factories/user";
import { prisma } from "~/.server/service/prisma";
import type { ValidBoard } from "~/models/board";

import { boardService } from ".";

const dummyBoard = {
  cards: [
    {
      url: "https://example.com",
      text: "テキスト",
    },
  ],
} satisfies ValidBoard;

describe("boardService", () => {
  describe("createBoard", () => {
    test("ボードを作成できる", async () => {
      // arrange
      const user = await UserFactory.create(); // findOrFetchUserが作成するユーザー
      // act
      const actual = await boardService.createOrUpdateBoard(
        user.did,
        dummyBoard,
      );
      // assert
      expect(await prisma.user.findFirst()).toEqual(user);
      expect(actual).toEqual(dummyBoard);
    });
  });
});
