import { asDid } from "@atproto/did";
import { http, HttpResponse } from "msw";

import { mockedLogger } from "~/mocks/logger";
import { server } from "~/mocks/server";
import { Board, BoardParseError } from "~/models/board";
import { BoardFactory, cardsFromFactory } from "~/server/factories/board";
import { UserFactory } from "~/server/factories/user";

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
  describe("findOrFetchBoard", () => {
    test("既存のボードがある場合はそのまま返す", async () => {
      // arrange
      const existing = await BoardFactory.create();
      // act
      const actual = await boardService.findOrFetchBoard(
        asDid(existing.userDid),
      );
      // assert
      expect(actual).toEqual(new Board(existing.userDid, cardsFromFactory));
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
      const actual = await boardService.findOrFetchBoard(asDid(user.did));
      // assert
      expect(actual).toEqual(new Board(user.did, dummyCards));
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
      const actual = await boardService.findOrFetchBoard(asDid(user.did));
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
      const actual = await boardService.findOrFetchBoard(asDid(user.did));
      // assert
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        expect.anything(),
        "PDSからのboardの取得に失敗しました",
      );
      expect(actual).toBeNull();
    });
  });

  describe("parseBoardFromForm", () => {
    test("正しい形式のJSONならBoardを返す", async () => {
      // arrange
      const userDid = asDid("did:plc:dummy");
      const rawBoard = JSON.stringify({ cards: dummyCards });
      // act
      const actual = await boardService.parseBoardFromForm(userDid, rawBoard);
      // assert
      expect(actual).toEqual(new Board(userDid, dummyCards));
    });
    test("JSONとして不正な文字列ならErrorを返す", async () => {
      // arrange
      const userDid = asDid("did:plc:dummy");
      // act
      const actual = await boardService.parseBoardFromForm(
        userDid,
        "{invalid-json",
      );
      // assert
      expect(actual).toBeInstanceOf(SyntaxError);
    });
    test("cardsを含まない形式ならBoardParseErrorを返す", async () => {
      // arrange
      const userDid = asDid("did:plc:dummy");
      // act
      const actual = await boardService.parseBoardFromForm(
        userDid,
        JSON.stringify({}),
      );
      // assert
      expect(actual).toBeInstanceOf(BoardParseError);
    });
  });
});
