import { asDid } from "@atproto/did";
import { http, HttpResponse } from "msw";
import { mock } from "vitest-mock-extended";

import { LinkatAgent } from "~/libs/agent";
import { server } from "~/mocks/server";
import { Board, BoardParseError } from "~/models/board";
import { BoardFactory, cardsFromFactory } from "~/server/factories/board";
import { UserFactory } from "~/server/factories/user";
import { accountPdsRepositoryFactory } from "~/server/infrastructure/accountPdsRepository";
import { boardRepositoryFactory } from "~/server/infrastructure/boardRepository";
import { db } from "~/server/infrastructure/drizzle";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import { userDbRepositoryFactory } from "~/server/infrastructure/userDbRepository";

import {
  BoardDbDeleteError,
  BoardDbSaveError,
  BoardPdsDeleteError,
  BoardPdsSaveError,
  boardServiceFactory,
} from "./board";

const identityResolver = mock<IIdentityResolver>();
const boardRepository = boardRepositoryFactory({ db });
const userDbRepository = userDbRepositoryFactory({ db });
const boardService = boardServiceFactory({
  boardRepository,
  userDbRepository,
  accountPdsRepository: accountPdsRepositoryFactory({ identityResolver }),
});

const AVATAR_CID =
  "bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy";

const dummyProfileRecord = {
  uri: "at://did:plc:owner/app.bsky.actor.profile/self",
  cid: "bafyreidfayvfuwqa7qlnopdjiqrxzs6blmoeu4rujcjtnci5beludirz2a",
  value: {
    $type: "app.bsky.actor.profile",
    displayName: "Alice",
    description: "プロフィールの説明",
    avatar: {
      $type: "blob",
      ref: { $link: AVATAR_CID },
      mimeType: "image/jpeg",
      size: 1000,
    },
  },
};

const getRecordUrl = "https://pds.example.com/xrpc/com.atproto.repo.getRecord";

const mockIdentity = (did: string, handle: string | null | undefined) =>
  identityResolver.resolve.mockResolvedValue({
    type: "found",
    identity: { did: asDid(did), pds: "https://pds.example.com", handle },
  });

beforeEach(() => {
  vi.resetAllMocks();
  // 既定では、ハンドルとプロフィールは一時的な障害で取得できないものとする
  identityResolver.resolve.mockResolvedValue({ type: "unavailable" });
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

  describe("saveBoard", () => {
    test("持ち主の写しが無ければ、プロフィールを取得しハンドルを解決して作成する", async () => {
      // arrange
      const did = "did:plc:owner";
      mockIdentity(did, "alice.example.com");
      server.use(
        http.get(getRecordUrl, () => HttpResponse.json(dummyProfileRecord)),
      );
      const board = new Board(did, dummyCards);
      // act
      const actual = await boardService.saveBoard(board);
      // assert
      expect(actual).toMatchObject({
        did,
        handle: "alice.example.com",
        avatar: null,
        avatarCid: AVATAR_CID,
        description: "プロフィールの説明",
        displayName: "Alice",
      });
      expect(await userDbRepository.findByDid(asDid(did))).toEqual(actual);
      expect(await boardRepository.find(asDid(did))).toEqual(board);
    });
    test("持ち主の写しがあれば、プロフィールとハンドルを更新する", async () => {
      // arrange
      const user = await UserFactory.create({
        did: "did:plc:owner",
        handle: "old.example.com",
        displayName: "古い名前",
      });
      mockIdentity(user.did, "alice.example.com");
      server.use(
        http.get(getRecordUrl, () => HttpResponse.json(dummyProfileRecord)),
      );
      // act
      const actual = await boardService.saveBoard(
        new Board(user.did, dummyCards),
      );
      // assert
      expect(actual).toMatchObject({
        handle: "alice.example.com",
        displayName: "Alice",
        avatarCid: AVATAR_CID,
      });
    });
    test("検証済みのハンドルが同じ他の写しは、ハンドルをnullにする", async () => {
      // arrange
      const other = await UserFactory.create({ handle: "alice.example.com" });
      const did = "did:plc:owner";
      mockIdentity(did, "alice.example.com");
      server.use(
        http.get(getRecordUrl, () => HttpResponse.json(dummyProfileRecord)),
      );
      // act
      await boardService.saveBoard(new Board(did, dummyCards));
      // assert
      expect(await userDbRepository.findByDid(asDid(other.did))).toMatchObject({
        handle: null,
      });
    });
    test("ハンドルの検証に失敗したら、写しのハンドルをnullにする", async () => {
      // arrange
      const user = await UserFactory.create({ handle: "old.example.com" });
      mockIdentity(user.did, null);
      server.use(
        http.get(getRecordUrl, () => HttpResponse.json(dummyProfileRecord)),
      );
      // act
      const actual = await boardService.saveBoard(
        new Board(user.did, dummyCards),
      );
      // assert
      expect(actual.handle).toBeNull();
    });
    test("DIDが見つからなければ、写しのハンドルをnullにしてボードは保存する", async () => {
      // arrange
      const did = "did:plc:owner";
      identityResolver.resolve.mockResolvedValue({ type: "notFound" });
      const board = new Board(did, dummyCards);
      // act
      const actual = await boardService.saveBoard(board);
      // assert
      expect(actual).toMatchObject({
        did,
        handle: null,
        avatarCid: null,
        displayName: null,
      });
      expect(await boardRepository.find(asDid(did))).toEqual(board);
    });
    test("一時的な障害なら、既存のハンドルとプロフィールを残す", async () => {
      // arrange
      const user = await UserFactory.create({
        handle: "alice.example.com",
        displayName: "Alice",
        avatarCid: AVATAR_CID,
      });
      // act
      const actual = await boardService.saveBoard(
        new Board(user.did, dummyCards),
      );
      // assert
      expect(actual).toMatchObject({
        handle: "alice.example.com",
        displayName: "Alice",
        avatarCid: AVATAR_CID,
      });
    });
    test("プロフィールの取得に失敗したら、既存のプロフィールを残してハンドルは更新する", async () => {
      // arrange
      const user = await UserFactory.create({
        handle: "old.example.com",
        displayName: "Alice",
        avatarCid: AVATAR_CID,
      });
      mockIdentity(user.did, "alice.example.com");
      server.use(
        http.get(getRecordUrl, () =>
          HttpResponse.json({ error: "InternalServerError" }, { status: 500 }),
        ),
      );
      // act
      const actual = await boardService.saveBoard(
        new Board(user.did, dummyCards),
      );
      // assert
      expect(actual).toMatchObject({
        handle: "alice.example.com",
        displayName: "Alice",
        avatarCid: AVATAR_CID,
      });
    });
    test("初回にプロフィールの取得に失敗したら、プロフィールは空のまま作成する", async () => {
      // arrange
      const did = "did:plc:owner";
      mockIdentity(did, "alice.example.com");
      server.use(
        http.get(getRecordUrl, () =>
          HttpResponse.json({ error: "InternalServerError" }, { status: 500 }),
        ),
      );
      // act
      const actual = await boardService.saveBoard(new Board(did, dummyCards));
      // assert
      expect(actual).toMatchObject({
        did,
        handle: "alice.example.com",
        avatar: null,
        avatarCid: null,
        description: null,
        displayName: null,
      });
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

    test("PDSに保存してからDBに保存し、持ち主の写しを返す", async () => {
      // arrange
      const user = await UserFactory.create();
      mockIdentity(user.did, "alice.example.com");
      const board = new Board(user.did, dummyCards);
      let putRecordBody: unknown;
      server.use(
        http.get(getRecordUrl, () => HttpResponse.json(dummyProfileRecord)),
        http.post(putRecordUrl, async ({ request }) => {
          putRecordBody = await request.json();
          return HttpResponse.json({
            uri: dummyBoardRecord.uri,
            cid: dummyBoardRecord.cid,
          });
        }),
      );
      // act
      const actual = await boardService.publishBoard(
        createAgent(user.did),
        board,
      );
      // assert
      expect(actual).toMatchObject({
        did: user.did,
        handle: "alice.example.com",
      });
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
