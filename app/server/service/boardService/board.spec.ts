import { asDid } from "@atproto/did";
import { http, HttpResponse } from "msw";

import { LinkatAgent } from "~/libs/agent";
import { server } from "~/mocks/server";
import { Board, BoardParseError } from "~/models/board";
import { BoardFactory, cardsFromFactory } from "~/server/factories/board";
import { OwnerFactory } from "~/server/factories/owner";
import { boardRepositoryFactory } from "~/server/infrastructure/boardRepository";
import { db } from "~/server/infrastructure/drizzle";
import { ownerDbRepositoryFactory } from "~/server/infrastructure/ownerDbRepository";

import {
  BoardDbDeleteError,
  BoardDbSaveError,
  BoardPdsDeleteError,
  BoardPdsSaveError,
  boardServiceFactory,
} from "./board";

const boardRepository = boardRepositoryFactory({ db });
const ownerDbRepository = ownerDbRepositoryFactory({ db });
const boardService = boardServiceFactory({
  boardRepository,
  ownerDbRepository,
});

const dummyCards = [
  {
    url: "https://example.com",
    text: "board.spec.tsのカード",
  },
];

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

  describe("parseBoardFromForm", () => {
    test("正しい形式のJSONならBoardを返す", async () => {
      // arrange
      const ownerDid = asDid("did:plc:dummy");
      const rawBoard = JSON.stringify({ cards: dummyCards });
      // act
      const actual = await boardService.parseBoardFromForm(ownerDid, rawBoard);
      // assert
      expect(actual).toEqual(new Board(ownerDid, dummyCards));
    });
    test("JSONとして不正な文字列ならErrorを返す", async () => {
      // arrange
      const ownerDid = asDid("did:plc:dummy");
      // act
      const actual = await boardService.parseBoardFromForm(
        ownerDid,
        "{invalid-json",
      );
      // assert
      expect(actual).toBeInstanceOf(SyntaxError);
    });
    test("cardsを含まない形式ならBoardParseErrorを返す", async () => {
      // arrange
      const ownerDid = asDid("did:plc:dummy");
      // act
      const actual = await boardService.parseBoardFromForm(
        ownerDid,
        JSON.stringify({}),
      );
      // assert
      expect(actual).toBeInstanceOf(BoardParseError);
    });
  });

  describe("publishBoard", () => {
    const dummyBoardRecord = {
      uri: "at://did:plc:fuphupq2ha3kk45osfummw42/blue.linkat.board/self",
      cid: "bafyreiflxe3gz7tg4jje5w4wypqjvz5d4zntrols22gwp7btg2nh2t7wxm",
    };
    const putRecordUrl =
      "https://pds.example.com/xrpc/com.atproto.repo.putRecord";
    const createAgent = (did: string) =>
      new LinkatAgent({ did: asDid(did), service: "https://pds.example.com" });

    test("PDSに保存してからDBに保存する", async () => {
      // arrange
      const owner = await OwnerFactory.create();
      const board = new Board(owner.did, dummyCards);
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
      await boardService.publishBoard(createAgent(owner.did), board);
      // assert
      expect(putRecordBody).toMatchObject({
        repo: owner.did,
        collection: "blue.linkat.board",
        rkey: "self",
        record: { cards: dummyCards },
      });
      expect(await boardRepository.find(asDid(owner.did))).toEqual(board);
    });
    test("PDSへの保存に失敗したらDBに保存せずBoardPdsSaveErrorを投げる", async () => {
      // arrange
      const owner = await OwnerFactory.create();
      server.use(
        http.post(putRecordUrl, () =>
          HttpResponse.json({ error: "InternalServerError" }, { status: 500 }),
        ),
      );
      // act
      const actual = boardService.publishBoard(
        createAgent(owner.did),
        new Board(owner.did, dummyCards),
      );
      // assert
      await expect(actual).rejects.toThrow(BoardPdsSaveError);
      expect(await boardRepository.find(asDid(owner.did))).toBeNull();
    });
    test("DBへの保存に失敗したらBoardDbSaveErrorを投げる", async () => {
      // arrange
      const owner = await OwnerFactory.create();
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
        createAgent(owner.did),
        new Board(owner.did, dummyCards),
      );
      // assert
      await expect(actual).rejects.toThrow(BoardDbSaveError);
    });
  });

  describe("deleteBoard", () => {
    test("ボードと持ち主の写しを削除する", async () => {
      // arrange
      const board = await BoardFactory.create();
      const other = await BoardFactory.create();
      // act
      await boardService.deleteBoard(asDid(board.ownerDid));
      // assert
      expect(await boardRepository.find(asDid(board.ownerDid))).toBeNull();
      expect(
        await ownerDbRepository.findByDid(asDid(board.ownerDid)),
      ).toBeNull();
      expect(await boardRepository.find(asDid(other.ownerDid))).not.toBeNull();
      expect(
        await ownerDbRepository.findByDid(asDid(other.ownerDid)),
      ).not.toBeNull();
    });
    test("持ち主の写しが無くても、ボードを削除する", async () => {
      // arrange
      const did = "did:plc:nocopy";
      await BoardFactory.create({ ownerDid: did });
      // act
      await boardService.deleteBoard(asDid(did));
      // assert
      expect(await boardRepository.find(asDid(did))).toBeNull();
    });
  });

  describe("unpublishBoard", () => {
    const deleteRecordUrl =
      "https://pds.example.com/xrpc/com.atproto.repo.deleteRecord";
    const createAgent = (did: string) =>
      new LinkatAgent({ did: asDid(did), service: "https://pds.example.com" });

    test("PDSから削除してからDBから削除する", async () => {
      // arrange
      const board = await BoardFactory.create();
      let deleteRecordBody: unknown;
      server.use(
        http.post(deleteRecordUrl, async ({ request }) => {
          deleteRecordBody = await request.json();
          return HttpResponse.json({});
        }),
      );
      // act
      await boardService.unpublishBoard(
        createAgent(board.ownerDid),
        asDid(board.ownerDid),
      );
      // assert
      expect(deleteRecordBody).toMatchObject({
        repo: board.ownerDid,
        collection: "blue.linkat.board",
        rkey: "self",
      });
      expect(await boardRepository.find(asDid(board.ownerDid))).toBeNull();
      expect(
        await ownerDbRepository.findByDid(asDid(board.ownerDid)),
      ).toBeNull();
    });
    test("PDSからの削除に失敗したらDBから削除せずBoardPdsDeleteErrorを投げる", async () => {
      // arrange
      const board = await BoardFactory.create();
      server.use(
        http.post(deleteRecordUrl, () =>
          HttpResponse.json({ error: "InternalServerError" }, { status: 500 }),
        ),
      );
      // act
      const actual = boardService.unpublishBoard(
        createAgent(board.ownerDid),
        asDid(board.ownerDid),
      );
      // assert
      await expect(actual).rejects.toThrow(BoardPdsDeleteError);
      expect(await boardRepository.find(asDid(board.ownerDid))).not.toBeNull();
      expect(
        await ownerDbRepository.findByDid(asDid(board.ownerDid)),
      ).not.toBeNull();
    });
    test("DBからの削除に失敗したらBoardDbDeleteErrorを投げる", async () => {
      // arrange
      const board = await BoardFactory.create();
      server.use(http.post(deleteRecordUrl, () => HttpResponse.json({})));
      vi.spyOn(boardRepository, "delete").mockRejectedValueOnce(new Error());
      // act
      const actual = boardService.unpublishBoard(
        createAgent(board.ownerDid),
        asDid(board.ownerDid),
      );
      // assert
      await expect(actual).rejects.toThrow(BoardDbDeleteError);
    });
  });
});
