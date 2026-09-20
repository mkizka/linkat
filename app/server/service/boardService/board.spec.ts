import { asDid } from "@atproto/did";

import { Board } from "~/models/board";
import { BoardFactory, cardsFromFactory } from "~/server/factories/board";
import { UserFactory } from "~/server/factories/user";

import { boardService } from ".";

describe("boardService", () => {
  describe("findBoard", () => {
    test("既存のボードがある場合はそのまま返す", async () => {
      // arrange
      const existing = await BoardFactory.create();
      // act
      const actual = await boardService.findBoard(asDid(existing.userDid));
      // assert
      expect(actual).toEqual(new Board(existing.userDid, cardsFromFactory));
    });
    test("DBにボードが無ければnullを返す", async () => {
      // arrange
      const user = await UserFactory.create();
      // act
      const actual = await boardService.findBoard(asDid(user.did));
      // assert
      expect(actual).toBeNull();
    });
  });
});
