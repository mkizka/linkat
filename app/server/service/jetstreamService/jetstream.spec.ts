import { asDid } from "@atproto/did";
import { CommitType, EventType } from "@skyware/jetstream";
import { eq } from "drizzle-orm";
import { http, HttpResponse } from "msw";

import { mockedLogger } from "~/mocks/logger";
import { server } from "~/mocks/server";
import { db } from "~/server/infrastructure/drizzle";
import { boardTable } from "~/server/infrastructure/schema";

import { handleCreateOrUpdate } from "./jetstream";

const dummyEvent = (did: string) =>
  ({
    did: asDid(did),
    time_us: Date.now() * 1000,
    kind: EventType.Commit,
    commit: {
      operation: CommitType.Create,
      rev: "abc",
      collection: "blue.linkat.board",
      rkey: "self",
      cid: "bafyreiflxe3gz7tg4jje5w4wypqjvz5d4zntrols22gwp7btg2nh2t7wxm",
      record: {
        $type: "blue.linkat.board",
        cards: [{ url: "https://example.com", text: "テスト" }],
      },
    },
  }) as const;

describe("jetstreamService", () => {
  describe("handleCreateOrUpdate", () => {
    test("ユーザーがDBになくBlueskyからも取得できない場合、エラーにせずボードの保存をスキップする", async () => {
      // arrange
      const did = "did:plc:notfounduser0000000000000";
      server.use(
        http.get(
          "https://public.api.example.com/xrpc/app.bsky.actor.getProfile",
          () => HttpResponse.json("", { status: 500 }),
        ),
      );
      // act
      const actual = handleCreateOrUpdate(dummyEvent(did));
      // assert
      await expect(actual).resolves.toBeUndefined();
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        { did },
        "ユーザーが見つからないためボードの更新をスキップしました",
      );
      const boards = await db
        .select()
        .from(boardTable)
        .where(eq(boardTable.userDid, did));
      expect(boards).toEqual([]);
    });
  });
});
