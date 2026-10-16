import { asDid } from "@atproto/did";
import { buildAgent } from "@atproto/lex";
import { http, HttpResponse } from "msw";
import { mock } from "vitest-mock-extended";

import { server } from "~/mocks/server";
import { BoardFactory } from "~/server/factories/board";
import type { IOAuthClient } from "~/server/infrastructure/auth/oauthClient";
import { boardRepositoryFactory } from "~/server/infrastructure/board/boardRepository";
import { bskyLinkPdsRepositoryFactory } from "~/server/infrastructure/bskyLink/bskyLinkPdsRepository";
import { db } from "~/server/infrastructure/db/drizzle";

import { BskyLinkSelectionError, bskyLinkServiceFactory } from "./bskyLink";

const oauthClient = mock<IOAuthClient>();
oauthClient.restore.mockImplementation((did) =>
  Promise.resolve(buildAgent({ did, service: "https://pds.example.com" })),
);
const bskyLinkService = bskyLinkServiceFactory({
  boardRepository: boardRepositoryFactory({ db }),
  bskyLinkPdsRepository: bskyLinkPdsRepositoryFactory({ oauthClient }),
});

const xrpcUrl = (nsid: string) => `https://pds.example.com/xrpc/${nsid}`;
const cid = "bafyreiflxe3gz7tg4jje5w4wypqjvz5d4zntrols22gwp7btg2nh2t7wxm";

const createBoard = () =>
  BoardFactory.create({
    record: JSON.stringify({
      cards: [
        { url: "https://example.com/a", text: "A" },
        { text: "テキストだけ" },
        { url: "https://example.com/b" },
        { url: "http://example.com/c", text: "http" },
      ],
    }),
  });

describe("bskyLinkService", () => {
  describe("exportCards", () => {
    test("選んだカードのリンクを作り、プロフィールのリンクを置き換えて古いリンクを消す", async () => {
      // arrange
      const did = asDid((await createBoard()).ownerDid);
      const created: unknown[] = [];
      const deleted: unknown[] = [];
      let putBody: unknown;
      server.use(
        http.get(xrpcUrl("com.atproto.repo.getRecord"), () =>
          HttpResponse.json({
            uri: `at://${did}/app.bsky.actor.profile/self`,
            value: {
              $type: "app.bsky.actor.profile",
              displayName: "名前",
              links: [
                { uri: `at://${did}/app.bsky.actor.link/old`, cid },
                { uri: "at://did:plc:other/app.bsky.actor.link/x", cid },
              ],
            },
          }),
        ),
        http.post(
          xrpcUrl("com.atproto.repo.createRecord"),
          async ({ request }) => {
            created.push(await request.json());
            return HttpResponse.json({
              uri: `at://${did}/app.bsky.actor.link/new${created.length}`,
              cid,
            });
          },
        ),
        http.post(
          xrpcUrl("com.atproto.repo.putRecord"),
          async ({ request }) => {
            putBody = await request.json();
            return HttpResponse.json({
              uri: `at://${did}/app.bsky.actor.profile/self`,
              cid,
            });
          },
        ),
        http.post(
          xrpcUrl("com.atproto.repo.deleteRecord"),
          async ({ request }) => {
            deleted.push(await request.json());
            return HttpResponse.json({});
          },
        ),
      );
      // act
      const actual = await bskyLinkService.exportCards(did, [2, 0]);
      // assert
      expect(actual).toEqual([
        { url: "https://example.com/a", text: "A" },
        { url: "https://example.com/b" },
      ]);
      expect(created).toMatchObject([
        {
          collection: "app.bsky.actor.link",
          record: { url: "https://example.com/a", title: "A" },
        },
        {
          collection: "app.bsky.actor.link",
          record: { url: "https://example.com/b" },
        },
      ]);
      expect(putBody).toMatchObject({
        collection: "app.bsky.actor.profile",
        rkey: "self",
        record: {
          displayName: "名前",
          links: [
            { uri: `at://${did}/app.bsky.actor.link/new1`, cid },
            { uri: `at://${did}/app.bsky.actor.link/new2`, cid },
          ],
        },
      });
      expect(deleted).toMatchObject([
        { collection: "app.bsky.actor.link", rkey: "old" },
      ]);
    });
    test("リンクのタイトルをカードのテキストの40書記素で切る", async () => {
      // arrange
      const family = "👨‍👩‍👧";
      const did = asDid(
        (
          await BoardFactory.create({
            record: JSON.stringify({
              cards: [{ url: "https://example.com", text: family.repeat(50) }],
            }),
          })
        ).ownerDid,
      );
      const created: unknown[] = [];
      server.use(
        http.get(xrpcUrl("com.atproto.repo.getRecord"), () =>
          HttpResponse.json(
            { error: "RecordNotFound", message: "Could not locate record" },
            { status: 400 },
          ),
        ),
        http.post(
          xrpcUrl("com.atproto.repo.createRecord"),
          async ({ request }) => {
            created.push(await request.json());
            return HttpResponse.json({
              uri: `at://${did}/app.bsky.actor.link/new`,
              cid,
            });
          },
        ),
        http.post(xrpcUrl("com.atproto.repo.putRecord"), () =>
          HttpResponse.json({
            uri: `at://${did}/app.bsky.actor.profile/self`,
            cid,
          }),
        ),
      );
      // act
      await bskyLinkService.exportCards(did, [0]);
      // assert
      expect(created).toMatchObject([{ record: { title: family.repeat(17) } }]);
    });
    test.each([[[]], [[1]], [[3]], [[0, 5]]])(
      "書き出せないカードを選んだらBskyLinkSelectionErrorを投げる(%j)",
      async (cardIndexes) => {
        // arrange
        const did = asDid((await createBoard()).ownerDid);
        // act
        const actual = bskyLinkService.exportCards(did, cardIndexes);
        // assert
        await expect(actual).rejects.toThrow(BskyLinkSelectionError);
      },
    );
  });
});
