import { UserFactory } from "~/.server/factories/user";
import type { ValidBoard } from "~/models/board";

import { boardService } from ".";

vi.mock("../userService");

const dummyBoard = {
  id: "dummy-board",
  cards: [
    {
      id: "dummy-card",
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
      const actual = await boardService.createBoard(user.did, dummyBoard);
      // assert
      expect(actual.userDid).toBe(user.did);
    });
  });
});
