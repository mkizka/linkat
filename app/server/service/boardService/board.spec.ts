import { http, HttpResponse } from "msw";

import { mockedLogger } from "~/mocks/logger";
import { server } from "~/mocks/server";
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

const dummyBoardRecord = {
  uri: "at://did:plc:fuphupq2ha3kk45osfummw42/dev.mkizka.test.profile.board/self",
  cid: "bafyreiflxe3gz7tg4jje5w4wypqjvz5d4zntrols22gwp7btg2nh2t7wxm",
  value: {
    $type: "dev.mkizka.test.profile.board",
    cards: dummyBoard.cards,
  },
};

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
  describe("findOrFetchBoard", () => {
    test("既存のボードがある場合はそのまま返す", async () => {
      // arrange
      const board = await BoardFactory.create();
      // act
      const actual = await boardService.findOrFetchBoard(board.userDid);
      // assert
      expect(actual).toEqual({ cards: cardsFromFactory });
    });
    test("DBにボードがなくてもPDSから取得できればDBに保存して返す", async () => {
      // arrange
      const user = await UserFactory.create();
      server.use(
        http.get(
          "https://public.api.example.com/xrpc/com.atproto.repo.getRecord",
          () => HttpResponse.json(dummyBoardRecord),
        ),
      );
      // act
      const actual = await boardService.findOrFetchBoard(user.did);
      // assert
      expect(actual).toEqual(dummyBoard);
    });
    test("DBにボードがなくPDSから取得したボードが不正ならnullを返す", async () => {
      // arrange
      server.use(
        http.get(
          "https://public.api.example.com/xrpc/com.atproto.repo.getRecord",
          () =>
            HttpResponse.json({
              ...dummyBoardRecord,
              value: { $type: "invalid" },
            }),
        ),
      );
      // act
      const actual = await boardService.findOrFetchBoard("did:plc:example");
      // assert
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        "PDSからのboardの形式が不正でした",
        expect.anything(),
      );
      expect(actual).toBeNull();
    });
    test("DBにもPDSにもボードが無いときはnullを返す", async () => {
      // arrange
      server.use(
        http.get(
          "https://public.api.example.com/xrpc/com.atproto.repo.getRecord",
          () => HttpResponse.json({}, { status: 400 }),
        ),
      );
      // act
      const actual = await boardService.findOrFetchBoard("did:plc:example");
      // assert
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        "PDSからのboardの取得に失敗しました",
        expect.anything(),
      );
      expect(actual).toBeNull();
    });
  });
});
