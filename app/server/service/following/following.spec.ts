import { asDid } from "@atproto/did";
import { http, HttpResponse } from "msw";

import { server } from "~/mocks/server";
import { BoardFactory } from "~/server/factories/board";
import { OwnerFactory } from "~/server/factories/owner";
import { boardRepositoryFactory } from "~/server/infrastructure/board/boardRepository";
import { db } from "~/server/infrastructure/db/drizzle";
import { followFetcherFactory } from "~/server/infrastructure/follow/followFetcher";
import { loggerFactory } from "~/server/infrastructure/logger/logger";
import { ownerRepositoryFactory } from "~/server/infrastructure/owner/ownerRepository";
import { ownerViewServiceFactory } from "~/server/service/owner/ownerView";

import { followingServiceFactory } from "./following";

const followingService = followingServiceFactory({
  boardRepository: boardRepositoryFactory({ db }),
  followFetcher: followFetcherFactory({ logger: loggerFactory() }),
  ownerRepository: ownerRepositoryFactory({ db }),
  ownerViewService: ownerViewServiceFactory(),
});

const editorDid = asDid("did:plc:editor");
const getFollowsUrl =
  "https://public.api.example.com/xrpc/app.bsky.graph.getFollows";

const profile = (did: string) => ({
  did,
  handle: `${did.replace("did:plc:", "")}.example.com`,
});

const mockFollows = (pages: string[][]) => {
  server.use(
    http.get(getFollowsUrl, ({ request }) => {
      const page = Number(new URL(request.url).searchParams.get("cursor"));
      return HttpResponse.json({
        subject: profile(editorDid),
        follows: (pages[page] ?? []).map(profile),
        cursor: page + 1 < pages.length ? String(page + 1) : undefined,
      });
    }),
  );
};

describe("followingService", () => {
  describe("findFollowingBoards", () => {
    test("フォロー中の持ち主のボードを、カード0枚を除いて更新が新しい順に返す", async () => {
      // arrange
      const old = await BoardFactory.create({
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      });
      const recent = await BoardFactory.create({
        updatedAt: new Date("2026-02-01T00:00:00Z"),
      });
      const empty = await BoardFactory.create({
        record: JSON.stringify({ cards: [] }),
      });
      await BoardFactory.create();
      const withoutBoard = await OwnerFactory.create();
      mockFollows([
        [old.ownerDid, empty.ownerDid],
        [recent.ownerDid, withoutBoard.did],
      ]);
      // act
      const actual = await followingService.findFollowingBoards({ editorDid });
      // assert
      expect(actual).toEqual([
        {
          owner: expect.objectContaining({ did: recent.ownerDid }),
          updatedAt: recent.updatedAt,
        },
        {
          owner: expect.objectContaining({ did: old.ownerDid }),
          updatedAt: old.updatedAt,
        },
      ]);
    });
    test("件数を指定するとその件数までを返す", async () => {
      // arrange
      const boards = [
        await BoardFactory.create({
          updatedAt: new Date("2026-01-01T00:00:00Z"),
        }),
        await BoardFactory.create({
          updatedAt: new Date("2026-02-01T00:00:00Z"),
        }),
      ];
      mockFollows([boards.map((board) => board.ownerDid)]);
      // act
      const actual = await followingService.findFollowingBoards({
        editorDid,
        limit: 1,
      });
      // assert
      expect(actual).toEqual([
        expect.objectContaining({
          owner: expect.objectContaining({ did: boards[1]?.ownerDid }),
        }),
      ]);
    });
    test("フォロー一覧を取得できなければエラーを返す", async () => {
      // arrange
      server.use(
        http.get(getFollowsUrl, () => HttpResponse.json({}, { status: 500 })),
      );
      // act
      const actual = await followingService.findFollowingBoards({ editorDid });
      // assert
      expect(actual).toBeInstanceOf(Error);
    });
  });
});
