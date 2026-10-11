import { asDid } from "@atproto/did";
import { http, HttpResponse } from "msw";

import { server } from "~/mocks/server";
import { BoardFactory } from "~/server/factories/board";
import { UserFactory } from "~/server/factories/user";
import { boardRepositoryFactory } from "~/server/infrastructure/boardRepository";
import { db } from "~/server/infrastructure/drizzle";

import { followServiceFactory } from "./follow";

const followService = followServiceFactory({
  boardRepository: boardRepositoryFactory({ db }),
});

const profile = (did: string) => ({
  did,
  handle: `${did.replace("did:plc:", "")}.example.com`,
  displayName: `User ${did}`,
});

describe("followService", () => {
  describe("findFollowingBoards", () => {
    test("フォロー中のユーザーのボードを、カード0枚を除いて更新が新しい順に返す", async () => {
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
      const withoutBoard = await UserFactory.create();
      server.use(
        http.get(
          "https://public.api.example.com/xrpc/app.bsky.graph.getFollows",
          ({ request }) => {
            const cursor = new URL(request.url).searchParams.get("cursor");
            if (!cursor) {
              return HttpResponse.json({
                subject: profile("did:plc:me"),
                follows: [old, empty].map((b) => profile(b.userDid)),
                cursor: "next",
              });
            }
            return HttpResponse.json({
              subject: profile("did:plc:me"),
              follows: [recent.userDid, withoutBoard.did].map(profile),
            });
          },
        ),
      );
      // act
      const actual = await followService.findFollowingBoards({
        userDid: asDid("did:plc:me"),
      });
      // assert
      expect(actual).toEqual([
        {
          ...profile(recent.userDid),
          avatar: null,
          updatedAt: recent.updatedAt,
        },
        { ...profile(old.userDid), avatar: null, updatedAt: old.updatedAt },
      ]);
    });
    test("件数を指定するとその件数までを返す", async () => {
      // arrange
      const boards = await Promise.all([
        BoardFactory.create({ updatedAt: new Date("2026-01-01T00:00:00Z") }),
        BoardFactory.create({ updatedAt: new Date("2026-02-01T00:00:00Z") }),
      ]);
      server.use(
        http.get(
          "https://public.api.example.com/xrpc/app.bsky.graph.getFollows",
          () =>
            HttpResponse.json({
              subject: profile("did:plc:me"),
              follows: boards.map((b) => profile(b.userDid)),
            }),
        ),
      );
      // act
      const actual = await followService.findFollowingBoards({
        userDid: asDid("did:plc:me"),
        limit: 1,
      });
      // assert
      expect(actual.map((b) => b.did)).toEqual([boards[1].userDid]);
    });
  });
});
