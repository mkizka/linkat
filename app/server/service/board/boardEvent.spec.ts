import { asDid } from "@atproto/did";
import { buildAgent } from "@atproto/lex";
import { http, HttpResponse } from "msw";
import { mock, mockReset } from "vitest-mock-extended";

import { server } from "~/mocks/server";
import { Board } from "~/models/board";
import { BoardFactory } from "~/server/factories/board";
import { OwnerFactory } from "~/server/factories/owner";
import type { IOAuthClient } from "~/server/infrastructure/auth/oauthClient";
import { boardPdsRepositoryFactory } from "~/server/infrastructure/board/boardPdsRepository";
import { boardRepositoryFactory } from "~/server/infrastructure/board/boardRepository";
import { db } from "~/server/infrastructure/db/drizzle";
import { ownerRepositoryFactory } from "~/server/infrastructure/owner/ownerRepository";
import type { IOwnerService } from "~/server/service/owner/owner";

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
  describe("handleEditorSave", () => {
    const dummyBoardRecord = {
      uri: "at://did:plc:fuphupq2ha3kk45osfummw42/blue.linkat.board/self",
      cid: "bafyreiflxe3gz7tg4jje5w4wypqjvz5d4zntrols22gwp7btg2nh2t7wxm",
    };
    const putRecordUrl =
      "https://pds.example.com/xrpc/com.atproto.repo.putRecord";

    test("PDSに保存してからボードの写しだけを保存する", async () => {
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
      await boardEventService.handleEditorSave(board);
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
      const actual = boardEventService.handleEditorSave(
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
      const actual = boardEventService.handleEditorSave(
        new Board(owner.did, dummyCards),
      );
      // assert
      await expect(actual).rejects.toThrow(BoardDbSaveError);
    });
  });

  describe("handleEditorSync", () => {
    const getRecordUrl =
      "https://pds.example.com/xrpc/com.atproto.repo.getRecord";

    test("PDSにボードがあれば持ち主とボードの写しを書く", async () => {
      // arrange
      const did = asDid("did:plc:synceditor");
      server.use(
        http.get(getRecordUrl, () =>
          HttpResponse.json({
            uri: `at://${did}/blue.linkat.board/self`,
            value: { $type: "blue.linkat.board", cards: dummyCards },
          }),
        ),
      );
      // act
      const actual = await boardEventService.handleEditorSync(did);
      // assert
      expect(actual).toEqual({ boardImported: true });
      expect(ownerService.syncOwner).toHaveBeenCalledWith(did);
      expect(await boardRepository.find(did)).toEqual(
        new Board(did, dummyCards),
      );
    });
    test("PDSにボードが無ければボードの写しを作らない", async () => {
      // arrange
      const did = asDid("did:plc:synceditornoboard");
      server.use(
        http.get(getRecordUrl, () =>
          HttpResponse.json(
            { error: "RecordNotFound", message: "Could not locate record" },
            { status: 400 },
          ),
        ),
      );
      // act
      const actual = await boardEventService.handleEditorSync(did);
      // assert
      expect(actual).toEqual({ boardImported: false });
      expect(ownerService.syncOwner).toHaveBeenCalledWith(did);
      expect(await boardRepository.find(did)).toBeNull();
    });
  });

  describe("handleBoardDeleteCommit", () => {
    test("ボードと持ち主の写しを削除する", async () => {
      // arrange
      const board = await BoardFactory.create();
      const other = await BoardFactory.create();
      // act
      await boardEventService.handleBoardDeleteCommit(asDid(board.ownerDid));
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
      await boardEventService.handleBoardDeleteCommit(asDid(did));
      // assert
      expect(await boardRepository.find(asDid(did))).toBeNull();
    });
  });

  describe("handleEditorDelete", () => {
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
      await boardEventService.handleEditorDelete(asDid(board.ownerDid));
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
      const actual = boardEventService.handleEditorDelete(
        asDid(board.ownerDid),
      );
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
      const actual = boardEventService.handleEditorDelete(
        asDid(board.ownerDid),
      );
      // assert
      await expect(actual).rejects.toThrow(BoardDbDeleteError);
    });
  });
});
