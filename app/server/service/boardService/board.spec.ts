import { asDid } from "@atproto/did";
import { http, HttpResponse } from "msw";

import { LinkatAgent } from "~/libs/agent";
import { server } from "~/mocks/server";
import { Board, BoardParseError } from "~/models/board";
import { BoardFactory, cardsFromFactory } from "~/server/factories/board";
import { UserFactory } from "~/server/factories/user";
import { boardRepositoryFactory } from "~/server/infrastructure/boardRepository";
import { db } from "~/server/infrastructure/drizzle";
import { userDbRepositoryFactory } from "~/server/infrastructure/userDbRepository";

import {
  BoardDbDeleteError,
  BoardDbSaveError,
  BoardPdsDeleteError,
  BoardPdsSaveError,
  boardServiceFactory,
} from "./board";

const boardRepository = boardRepositoryFactory({ db });
const userDbRepository = userDbRepositoryFactory({ db });
const boardService = boardServiceFactory({
  boardRepository,
  userDbRepository,
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

  describe("deleteBoard", () => {
    test("ボードと持ち主の写しを削除する", async () => {
      // arrange
      const board = await BoardFactory.create();
      const other = await BoardFactory.create();
      // act
      await boardService.deleteBoard(asDid(board.userDid));
      // assert
      expect(await boardRepository.find(asDid(board.userDid))).toBeNull();
      expect(await userDbRepository.findByDid(asDid(board.userDid))).toBeNull();
      expect(await boardRepository.find(asDid(other.userDid))).not.toBeNull();
      expect(
        await userDbRepository.findByDid(asDid(other.userDid)),
      ).not.toBeNull();
    });
    test("持ち主の写しが無くても、ボードを削除する", async () => {
      // arrange
      const did = "did:plc:nocopy";
      await BoardFactory.create({ userDid: did });
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
        createAgent(board.userDid),
        asDid(board.userDid),
      );
      // assert
      expect(deleteRecordBody).toMatchObject({
        repo: board.userDid,
        collection: "blue.linkat.board",
        rkey: "self",
      });
      expect(await boardRepository.find(asDid(board.userDid))).toBeNull();
      expect(await userDbRepository.findByDid(asDid(board.userDid))).toBeNull();
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
        createAgent(board.userDid),
        asDid(board.userDid),
      );
      // assert
      await expect(actual).rejects.toThrow(BoardPdsDeleteError);
      expect(await boardRepository.find(asDid(board.userDid))).not.toBeNull();
      expect(
        await userDbRepository.findByDid(asDid(board.userDid)),
      ).not.toBeNull();
    });
    test("DBからの削除に失敗したらBoardDbDeleteErrorを投げる", async () => {
      // arrange
      const board = await BoardFactory.create();
      server.use(http.post(deleteRecordUrl, () => HttpResponse.json({})));
      vi.spyOn(boardRepository, "delete").mockRejectedValueOnce(new Error());
      // act
      const actual = boardService.unpublishBoard(
        createAgent(board.userDid),
        asDid(board.userDid),
      );
      // assert
      await expect(actual).rejects.toThrow(BoardDbDeleteError);
    });
  });
});
