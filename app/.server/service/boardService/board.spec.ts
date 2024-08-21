import type { AppBskyActorDefs } from "@atproto/api";
import { http, HttpResponse } from "msw";

import { BoardFactory, cardsFromFactory } from "~/.server/factories/board";
import { UserFactory } from "~/.server/factories/user";
import { prisma } from "~/.server/service/prisma";
import { server } from "~/mocks/server";
import type { ValidBoard } from "~/models/board";

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

const dummyBlueskyProfile = {
  did: "did:plc:dfbe2uvzisfdxwscnwcxdta6",
  handle: "example.com",
  displayName: "Alice",
  associated: {
    lists: 1,
    feedgens: 1,
    labeler: false,
  },
  labels: [],
  description: "Test user 1",
  indexedAt: "2024-07-21T08:19:48.394Z",
  followersCount: 2,
  followsCount: 2,
  postsCount: 42,
} satisfies AppBskyActorDefs.ProfileViewDetailed;

describe("boardService", () => {
  describe("createBoard", () => {
    test("ボードがない場合は新規作成する", async () => {
      // arrange
      const user = await UserFactory.create(); // findOrFetchUserが作成するユーザー
      // act
      const actual = await boardService.createOrUpdateBoard(
        user.did,
        dummyBoard,
      );
      // assert
      expect(await prisma.user.findFirst()).toEqual(user);
      expect(actual).toEqual(dummyBoard);
    });
    test("既存のボードがある場合は更新する", async () => {
      // arrange
      const board = await BoardFactory.create();
      // act
      const actual = await boardService.createOrUpdateBoard(
        board.userDid,
        dummyBoard,
      );
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
    test("ボードがなくてもPDSから取得できればDBに保存して返す", async () => {
      // arrange
      server.use(
        http.get(
          "https://public.api.example.com/xrpc/com.atproto.repo.getRecord",
          () => HttpResponse.json(dummyBoardRecord),
        ),
        http.get(
          "https://public.api.example.com/xrpc/app.bsky.actor.getProfile",
          () => HttpResponse.json(dummyBlueskyProfile),
        ),
      );
      // act
      const actual = await boardService.findOrFetchBoard("example.com");
      // assert
      expect(actual).toEqual(dummyBoard);
    });
  });
});
