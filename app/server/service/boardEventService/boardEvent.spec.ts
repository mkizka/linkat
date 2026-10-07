import { asDid } from "@atproto/did";
import { buildAgent } from "@atproto/lex";
import { http, HttpResponse } from "msw";
import { mock, mockReset } from "vitest-mock-extended";

import { server } from "~/mocks/server";
import { Board } from "~/models/board";
import { BoardFactory } from "~/server/factories/board";
import { OwnerFactory } from "~/server/factories/owner";
import { boardPdsRepositoryFactory } from "~/server/infrastructure/boardPdsRepository";
import { boardRepositoryFactory } from "~/server/infrastructure/boardRepository";
import { db } from "~/server/infrastructure/drizzle";
import type { IOAuthClient } from "~/server/infrastructure/oauthClient";
import { ownerRepositoryFactory } from "~/server/infrastructure/ownerRepository";
import type { IOwnerService } from "~/server/service/ownerService/owner";

import {
  BoardDbDeleteError,
  BoardDbSaveError,
  boardEventServiceFactory,
  BoardPdsDeleteError,
  BoardPdsSaveError,
} from "./boardEvent";

const boardRepository = boardRepositoryFactory({ db });
const ownerRepository = ownerRepositoryFactory({ db });
const ownerService = mock<IOwnerService>();
const oauthClient = mock<IOAuthClient>();
const boardEventService = boardEventServiceFactory({
  boardRepository,
  boardPdsRepository: boardPdsRepositoryFactory({ oauthClient }),
  ownerRepository,
  ownerService,
});

beforeEach(() => {
  mockReset(ownerService);
  mockReset(oauthClient);
  oauthClient.restore.mockImplementation((did) =>
    Promise.resolve(buildAgent({ did, service: "https://pds.example.com" })),
  );
});

const dummyCards = [
  {
    url: "https://example.com",
    text: "boardEvent.spec.tsのカード",
  },
];

describe("boardEventService", () => {
  describe("publishBoard", () => {
    const dummyBoardRecord = {
      uri: "at://did:plc:fuphupq2ha3kk45osfummw42/blue.linkat.board/self",
      cid: "bafyreiflxe3gz7tg4jje5w4wypqjvz5d4zntrols22gwp7btg2nh2t7wxm",
    };
    const putRecordUrl =
      "https://pds.example.com/xrpc/com.atproto.repo.putRecord";

    test("PDSに保存してからボードの写しを保存し、持ち主の写しは書かない", async () => {
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
      await boardEventService.publishBoard(board);
      // assert
      expect(ownerService.syncOwner).not.toHaveBeenCalled();
      expect(putRecordBody).toMatchObject({
        repo: owner.did,
        collection: "blue.linkat.board",
        rkey: "self",
        record: { cards: dummyCards },
      });
      expect(await boardRepository.find(asDid(owner.did))).toEqual(board);
    });
    test("PDSへの保存に失敗したら写しを保存せずBoardPdsSaveErrorを投げる", async () => {
      // arrange
      const owner = await OwnerFactory.create();
      server.use(
        http.post(putRecordUrl, () =>
          HttpResponse.json({ error: "InternalServerError" }, { status: 500 }),
        ),
      );
      // act
      const actual = boardEventService.publishBoard(
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
      const actual = boardEventService.publishBoard(
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
      await boardEventService.deleteBoard(asDid(board.ownerDid));
      // assert
      expect(await boardRepository.find(asDid(board.ownerDid))).toBeNull();
      expect(await ownerRepository.findByDid(asDid(board.ownerDid))).toBeNull();
      expect(await boardRepository.find(asDid(other.ownerDid))).not.toBeNull();
      expect(
        await ownerRepository.findByDid(asDid(other.ownerDid)),
      ).not.toBeNull();
    });
    test("持ち主の写しが無くても、ボードを削除する", async () => {
      // arrange
      const did = "did:plc:nocopy";
      await BoardFactory.create({ ownerDid: did });
      // act
      await boardEventService.deleteBoard(asDid(did));
      // assert
      expect(await boardRepository.find(asDid(did))).toBeNull();
    });
  });

  describe("unpublishBoard", () => {
    const deleteRecordUrl =
      "https://pds.example.com/xrpc/com.atproto.repo.deleteRecord";

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
      await boardEventService.unpublishBoard(asDid(board.ownerDid));
      // assert
      expect(deleteRecordBody).toMatchObject({
        repo: board.ownerDid,
        collection: "blue.linkat.board",
        rkey: "self",
      });
      expect(await boardRepository.find(asDid(board.ownerDid))).toBeNull();
      expect(await ownerRepository.findByDid(asDid(board.ownerDid))).toBeNull();
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
      const actual = boardEventService.unpublishBoard(asDid(board.ownerDid));
      // assert
      await expect(actual).rejects.toThrow(BoardPdsDeleteError);
      expect(await boardRepository.find(asDid(board.ownerDid))).not.toBeNull();
      expect(
        await ownerRepository.findByDid(asDid(board.ownerDid)),
      ).not.toBeNull();
    });
    test("DBからの削除に失敗したらBoardDbDeleteErrorを投げる", async () => {
      // arrange
      const board = await BoardFactory.create();
      server.use(http.post(deleteRecordUrl, () => HttpResponse.json({})));
      vi.spyOn(boardRepository, "delete").mockRejectedValueOnce(new Error());
      // act
      const actual = boardEventService.unpublishBoard(asDid(board.ownerDid));
      // assert
      await expect(actual).rejects.toThrow(BoardDbDeleteError);
    });
  });
});
