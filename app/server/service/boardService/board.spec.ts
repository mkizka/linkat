import { asDid } from "@atproto/did";
import { http, HttpResponse } from "msw";

import { LinkatAgent } from "~/libs/agent";
import { mockedLogger } from "~/mocks/logger";
import { server } from "~/mocks/server";
import { Board, BoardParseError } from "~/models/board";
import { BoardFactory, cardsFromFactory } from "~/server/factories/board";
import { UserFactory } from "~/server/factories/user";
import { boardRepositoryFactory } from "~/server/infrastructure/boardRepository";
import { db } from "~/server/infrastructure/drizzle";
import { didServiceFactory } from "~/server/service/didService/did";

import {
  BoardDbSaveError,
  BoardPdsSaveError,
  boardServiceFactory,
} from "./board";

const boardRepository = boardRepositoryFactory({ db });
const boardService = boardServiceFactory({
  boardRepository,
  didService: didServiceFactory(),
});

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

  describe("publishBoard", () => {
    const putRecordUrl =
      "https://pds.example.com/xrpc/com.atproto.repo.putRecord";
    const createAgent = (did: string) =>
      new LinkatAgent({ did: asDid(did), service: "https://pds.example.com" });

    test("PDSに保存してからDBに保存する", async () => {
      // arrange
      const user = await UserFactory.create();
      const board = new Board(user.did, dummyCards);
      let putRecordBody: unknown;
      server.use(
        http.post(putRecordUrl, async ({ request }) => {
          putRecordBody = await request.json();
          return HttpResponse.json({
            uri: dummyBoardRecord.uri,
            cid: dummyBoardRecord.cid,
          });
        }),
      );
      // act
      await boardService.publishBoard(createAgent(user.did), board);
      // assert
      expect(putRecordBody).toMatchObject({
        repo: user.did,
        collection: "blue.linkat.board",
        rkey: "self",
        record: { cards: dummyCards },
      });
      expect(await boardRepository.find(asDid(user.did))).toEqual(board);
    });
    test("PDSへの保存に失敗したらDBに保存せずBoardPdsSaveErrorを投げる", async () => {
      // arrange
      const user = await UserFactory.create();
      server.use(
        http.post(putRecordUrl, () =>
          HttpResponse.json({ error: "InternalServerError" }, { status: 500 }),
        ),
      );
      // act
      const actual = boardService.publishBoard(
        createAgent(user.did),
        new Board(user.did, dummyCards),
      );
      // assert
      await expect(actual).rejects.toThrow(BoardPdsSaveError);
      expect(await boardRepository.find(asDid(user.did))).toBeNull();
    });
    test("DBへの保存に失敗したらBoardDbSaveErrorを投げる", async () => {
      // arrange
      const user = await UserFactory.create();
      server.use(
        http.post(putRecordUrl, () =>
          HttpResponse.json({
            uri: dummyBoardRecord.uri,
            cid: dummyBoardRecord.cid,
          }),
        ),
      );
      vi.spyOn(boardRepository, "save").mockRejectedValueOnce(new Error());
      // act
      const actual = boardService.publishBoard(
        createAgent(user.did),
        new Board(user.did, dummyCards),
      );
      // assert
      await expect(actual).rejects.toThrow(BoardDbSaveError);
    });
  });
});
