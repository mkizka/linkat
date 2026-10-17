import { asDid } from "@atproto/did";
import { buildAgent } from "@atproto/lex";
import { http, HttpResponse } from "msw";
import { mock } from "vitest-mock-extended";

import { server } from "~/mocks/server";
import type { IOAuthClient } from "~/server/infrastructure/auth/oauthClient";

import { bskyLinkPdsRepositoryFactory } from "./bskyLinkPdsRepository";

const oauthClient = mock<IOAuthClient>();
oauthClient.restore.mockImplementation((did) =>
  Promise.resolve(buildAgent({ did, service: "https://pds.example.com" })),
);
const bskyLinkPdsRepository = bskyLinkPdsRepositoryFactory({ oauthClient });

const did = asDid("did:plc:dummy");
const xrpcUrl = (nsid: string) => `https://pds.example.com/xrpc/${nsid}`;
const cid = "bafyreiflxe3gz7tg4jje5w4wypqjvz5d4zntrols22gwp7btg2nh2t7wxm";

describe("bskyLinkPdsRepository", () => {
  describe("replace", () => {
    test("カードのリンクを作り、プロフィールのリンクを置き換えて古いリンクを消す", async () => {
      // arrange
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
      await bskyLinkPdsRepository.replace(did, [
        { url: "https://example.com/a", text: "A" },
        { url: "https://example.com/b" },
      ]);
      // assert
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
    test.each([
      { text: "あ".repeat(50), title: "あ".repeat(40) },
      { text: "👨‍👩‍👧".repeat(50), title: "👨‍👩‍👧".repeat(17) },
    ])(
      "リンクのタイトルを40書記素かつ320バイト以内に切る($title)",
      async ({ text, title }) => {
        // arrange
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
        await bskyLinkPdsRepository.replace(did, [
          { url: "https://example.com", text },
        ]);
        // assert
        expect(created).toMatchObject([{ record: { title } }]);
      },
    );
  });
});
