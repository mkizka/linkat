import { asDid } from "@atproto/did";
import { buildAgent } from "@atproto/lex";
import { http, HttpResponse } from "msw";
import { mock } from "vitest-mock-extended";

import { server } from "~/mocks/server";
import type { IOAuthClient } from "~/server/infrastructure/auth/oauthClient";

import {
  BskyLinkCleanupError,
  BskyLinkConflictError,
  BskyLinkExportError,
  BskyLinkInvalidError,
  bskyLinkPdsRepositoryFactory,
} from "./bskyLinkPdsRepository";

const oauthClient = mock<IOAuthClient>();
oauthClient.restore.mockImplementation((did) =>
  Promise.resolve(buildAgent({ did, service: "https://pds.example.com" })),
);
const bskyLinkPdsRepository = bskyLinkPdsRepositoryFactory({ oauthClient });

const did = asDid("did:plc:dummy");
const xrpcUrl = (nsid: string) => `https://pds.example.com/xrpc/${nsid}`;
const cid = "bafyreiflxe3gz7tg4jje5w4wypqjvz5d4zntrols22gwp7btg2nh2t7wxm";
const icon = Buffer.from([1, 2, 3]);
const blob = {
  $type: "blob",
  ref: { $link: "bafkreiflxe3gz7tg4jje5w4wypqjvz5d4zntrols22gwp7btg2nh2t7wxm" },
  mimeType: "image/png",
  size: 3,
};

describe("bskyLinkPdsRepository", () => {
  describe("replace", () => {
    test("カードのリンクを作り、プロフィールのリンクを置き換えて古いリンクを消す", async () => {
      // arrange
      const created: unknown[] = [];
      const deleted: unknown[] = [];
      let putBody: unknown;
      let uploaded: Buffer | undefined;
      server.use(
        http.post(
          xrpcUrl("com.atproto.repo.uploadBlob"),
          async ({ request }) => {
            uploaded = Buffer.from(await request.arrayBuffer());
            return HttpResponse.json({ blob });
          },
        ),
        http.get(xrpcUrl("com.atproto.repo.getRecord"), () =>
          HttpResponse.json({
            uri: `at://${did}/app.bsky.actor.profile/self`,
            cid,
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
        { url: "https://a.example.com", title: "A", icon },
        { url: "https://b.example.com", icon: null },
      ]);
      // assert
      expect(created).toMatchObject([
        {
          collection: "app.bsky.actor.link",
          record: {
            url: "https://a.example.com",
            title: "A",
            icon: { ref: blob.ref, mimeType: "image/png" },
          },
        },
        {
          collection: "app.bsky.actor.link",
          record: { url: "https://b.example.com" },
        },
      ]);
      expect(created[1]).not.toHaveProperty("record.icon");
      expect(uploaded).toEqual(icon);
      expect(putBody).toMatchObject({
        collection: "app.bsky.actor.profile",
        rkey: "self",
        swapRecord: cid,
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
      { name: "URLが不正", dto: { url: "invalid", icon: null } },
      {
        name: "タイトルが40書記素を超える",
        dto: { url: "https://example.com", title: "あ".repeat(41), icon: null },
      },
      {
        name: "タイトルが320バイトを超える",
        dto: {
          url: "https://example.com",
          title: "👨‍👩‍👧".repeat(18),
          icon: null,
        },
      },
    ])(
      "$nameときはPDSに触れずBskyLinkInvalidErrorを投げる",
      async ({ dto }) => {
        // arrange
        oauthClient.restore.mockClear();
        // act
        const actual = bskyLinkPdsRepository.replace(did, [dto]);
        // assert
        await expect(actual).rejects.toThrow(BskyLinkInvalidError);
        expect(oauthClient.restore).not.toHaveBeenCalled();
      },
    );
    describe("PDSとの通信に失敗したとき", () => {
      const xrpcError = (error: string, status = 400) =>
        HttpResponse.json({ error, message: error }, { status });

      beforeEach(() => {
        server.use(
          http.get(xrpcUrl("com.atproto.repo.getRecord"), () =>
            HttpResponse.json({
              uri: `at://${did}/app.bsky.actor.profile/self`,
              cid,
              value: {
                $type: "app.bsky.actor.profile",
                links: [{ uri: `at://${did}/app.bsky.actor.link/old`, cid }],
              },
            }),
          ),
          http.post(xrpcUrl("com.atproto.repo.createRecord"), () =>
            HttpResponse.json({
              uri: `at://${did}/app.bsky.actor.link/new`,
              cid,
            }),
          ),
          http.post(xrpcUrl("com.atproto.repo.putRecord"), () =>
            HttpResponse.json({
              uri: `at://${did}/app.bsky.actor.profile/self`,
              cid,
            }),
          ),
          http.post(xrpcUrl("com.atproto.repo.deleteRecord"), () =>
            HttpResponse.json({}),
          ),
          http.post(xrpcUrl("com.atproto.repo.uploadBlob"), () =>
            HttpResponse.json({ blob }),
          ),
        );
      });

      test.each([
        {
          method: http.get,
          nsid: "com.atproto.repo.getRecord",
          response: () => xrpcError("InternalServerError", 500),
          expected: BskyLinkExportError,
        },
        {
          method: http.post,
          nsid: "com.atproto.repo.uploadBlob",
          response: () => xrpcError("InternalServerError", 500),
          expected: BskyLinkExportError,
        },
        {
          method: http.post,
          nsid: "com.atproto.repo.createRecord",
          response: () => xrpcError("InternalServerError", 500),
          expected: BskyLinkExportError,
        },
        {
          method: http.post,
          nsid: "com.atproto.repo.putRecord",
          response: () => xrpcError("InternalServerError", 500),
          expected: BskyLinkExportError,
        },
        {
          method: http.post,
          nsid: "com.atproto.repo.putRecord",
          response: () => xrpcError("InvalidSwap"),
          expected: BskyLinkConflictError,
        },
        {
          method: http.post,
          nsid: "com.atproto.repo.deleteRecord",
          response: () => xrpcError("InternalServerError", 500),
          expected: BskyLinkCleanupError,
        },
      ])(
        "$nsid の失敗は $expected.name になる",
        async ({ method, nsid, response, expected }) => {
          // arrange
          server.use(method(xrpcUrl(nsid), response));
          // act
          const actual = bskyLinkPdsRepository.replace(did, [
            { url: "https://example.com", icon },
          ]);
          // assert
          await expect(actual).rejects.toThrow(expected);
        },
      );
    });
  });
});
