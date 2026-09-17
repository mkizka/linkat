import { http, HttpResponse } from "msw";

import { mockedLogger } from "~/mocks/logger";
import { server } from "~/mocks/server";
import { Board } from "~/models/board";
import { BoardFactory, cardsFromFactory } from "~/server/factories/board";
import { UserFactory } from "~/server/factories/user";
import { prisma } from "~/server/service/prisma";

import { boardService } from ".";

const dummyCards = [
  {
    url: "https://example.com",
    text: "board.spec.tsのカード",
  },
];

const dummyBoardRecord = {
  uri: "at://did:plc:fuphupq2ha3kk45osfummw42/blue.linkat.board/self",
  cid: "bafyreiflxe3gz7tg4jje5w4wypqjvz5d4zntrols22gwp7btg2nh2t7wxm",
  value: {
    $type: "blue.linkat.board",
    cards: dummyCards,
  },
};

const dummyDidDocument = (did: string) => ({
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/secp256k1-2019/v1",
  ],
  id: did,
  service: [
    {
      id: "#atproto_pds",
      type: "AtprotoPersonalDataServer",
      serviceEndpoint: "https://pds.example.com",
    },
  ],
});

describe("boardService", () => {
  describe("createBoard", () => {
    test("ボードがない場合は新規作成する", async () => {
      // arrange
      const user = await UserFactory.create(); // findOrFetchUserが作成するユーザー
      const board = Board.of(user.did, dummyCards);
      // act
      const actual = await boardService.createOrUpdateBoard({ board });
      // assert
      expect(await prisma.user.findFirst()).toEqual(user);
      expect(actual).toEqual(board);
    });
    test("既存のボードがある場合は更新する", async () => {
      // arrange
      const existing = await BoardFactory.create();
      const board = Board.of(existing.userDid, dummyCards);
      // act
      const actual = await boardService.createOrUpdateBoard({ board });
      // assert
      expect(await prisma.user.findFirst()).toMatchObject({
        did: existing.userDid,
      });
      expect(actual).not.toEqual(existing);
      expect(actual).toEqual(board);
    });
    test("既存のボードを更新するとupdatedAtが更新される", async () => {
      // arrange
      const existing = await BoardFactory.create({
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      });
      const board = Board.of(existing.userDid, dummyCards);
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-02T00:00:00.000Z"));
      // act
      await boardService.createOrUpdateBoard({ board });
      // assert
      expect(await prisma.board.findFirst()).toMatchObject({
        updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      });
    });
  });
  describe("findOrFetchBoard", () => {
    test("既存のボードがある場合はそのまま返す", async () => {
      // arrange
      const existing = await BoardFactory.create();
      // act
      const actual = await boardService.findOrFetchBoard(existing.userDid);
      // assert
      expect(actual).toEqual(Board.of(existing.userDid, cardsFromFactory));
    });
    test("DBにボードがなくてもPDSから取得できればDBに保存して返す", async () => {
      // arrange
      const user = await UserFactory.create();
      server.use(
        http.get(
          `https://plc.example.com/${encodeURIComponent(user.did)}`,
          () => HttpResponse.json(dummyDidDocument(user.did)),
        ),
        http.get(
          "https://pds.example.com/xrpc/com.atproto.repo.getRecord",
          () => HttpResponse.json(dummyBoardRecord),
        ),
      );
      // act
      const actual = await boardService.findOrFetchBoard(user.did);
      // assert
      expect(actual).toEqual(Board.of(user.did, dummyCards));
    });
    test("DBにボードがなくPDSから取得したボードが不正ならnullを返す", async () => {
      // arrange
      const user = await UserFactory.create();
      server.use(
        http.get(
          `https://plc.example.com/${encodeURIComponent(user.did)}`,
          () => HttpResponse.json(dummyDidDocument(user.did)),
        ),
        http.get(
          "https://pds.example.com/xrpc/com.atproto.repo.getRecord",
          () =>
            HttpResponse.json({
              ...dummyBoardRecord,
              value: { $type: "invalid" },
            }),
        ),
      );
      // act
      const actual = await boardService.findOrFetchBoard(user.did);
      // assert
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        expect.anything(),
        "PDSからのboardの形式が不正でした",
      );
      expect(actual).toBeNull();
    });
    test("DBにもPDSにもボードが無いときはnullを返す", async () => {
      // arrange
      const user = await UserFactory.create();
      server.use(
        http.get(
          `https://plc.example.com/${encodeURIComponent(user.did)}`,
          () => HttpResponse.json(dummyDidDocument(user.did)),
        ),
        http.get(
          "https://pds.example.com/xrpc/com.atproto.repo.getRecord",
          () => HttpResponse.json({}, { status: 400 }),
        ),
      );
      // act
      const actual = await boardService.findOrFetchBoard(user.did);
      // assert
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        expect.anything(),
        "PDSからのboardの取得に失敗しました",
      );
      expect(actual).toBeNull();
    });
  });
});
