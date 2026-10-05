import { asDid } from "@atproto/did";

import { Board } from "~/models/board";
import { BoardFactory, cardsFromFactory } from "~/server/factories/board";
import { OwnerFactory } from "~/server/factories/owner";
import { boardRepositoryFactory } from "~/server/infrastructure/boardRepository";
import { db } from "~/server/infrastructure/drizzle";

import { boardServiceFactory } from "./board";

const boardService = boardServiceFactory({
  boardRepository: boardRepositoryFactory({ db }),
});

describe("boardService", () => {
  describe("findBoard", () => {
    test("既存のボードがある場合はそのまま返す", async () => {
      // arrange
      const existing = await BoardFactory.create();
      // act
      const actual = await boardService.findBoard(asDid(existing.ownerDid));
      // assert
      expect(actual).toEqual(new Board(existing.ownerDid, cardsFromFactory));
    });
    test("DBにボードが無ければnullを返す", async () => {
      // arrange
      const owner = await OwnerFactory.create();
      // act
      const actual = await boardService.findBoard(asDid(owner.did));
      // assert
      expect(actual).toBeNull();
    });
  });
});
