import { asDid } from "@atproto/did";
import { buildAgent } from "@atproto/lex";
import { encodeIco } from "icojs";
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
const faviconUrl = "https://icons.duckduckgo.com/ip3/:file";
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
const blob = {
  $type: "blob",
  ref: { $link: "bafkreiflxe3gz7tg4jje5w4wypqjvz5d4zntrols22gwp7btg2nh2t7wxm" },
  mimeType: "image/png",
  size: 3,
};

describe("bskyLinkPdsRepository", () => {
  beforeEach(() => {
    server.use(
      http.get(faviconUrl, () => new HttpResponse(null, { status: 404 })),
    );
  });

  describe("replace", () => {
    test("カードのリンクを作り、プロフィールのリンクを置き換えて古いリンクを消す", async () => {
      // arrange
      const created: unknown[] = [];
      const deleted: unknown[] = [];
      let putBody: unknown;
      let uploaded: Buffer | undefined;
      const ico = await encodeIco([{ buffer: png }]);
      server.use(
        http.get(faviconUrl, ({ params }) =>
          params.file === "a.example.com.ico"
            ? HttpResponse.arrayBuffer(ico, {
                headers: { "content-type": "image/x-icon" },
              })
            : new HttpResponse(null, { status: 404 }),
        ),
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
        { url: "https://a.example.com", text: "A" },
        { url: "https://b.example.com" },
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
      expect(uploaded?.subarray(0, 8)).toEqual(png.subarray(0, 8));
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
      { name: "URLが無い", cards: [{ text: "A" }] },
      { name: "URLの形式でない", cards: [{ url: "example" }] },
      {
        name: "タイトルが40書記素を超える",
        cards: [{ url: "https://example.com", text: "あ".repeat(41) }],
      },
      {
        name: "タイトルが320バイトを超える",
        cards: [{ url: "https://example.com", text: "👨‍👩‍👧".repeat(18) }],
      },
    ])("$nameカードはBskyLinkInvalidErrorになる", async ({ cards }) => {
      // arrange
      const requested = vi.fn();
      server.use(http.all("https://pds.example.com/*", requested));
      // act
      const actual = bskyLinkPdsRepository.replace(did, cards);
      // assert
      await expect(actual).rejects.toThrow(BskyLinkInvalidError);
      expect(requested).not.toHaveBeenCalled();
    });

    test("11枚以上ならプロフィールを更新せずBskyLinkInvalidErrorになる", async () => {
      // arrange
      const put = vi.fn();
      server.use(
        http.get(xrpcUrl("com.atproto.repo.getRecord"), () =>
          HttpResponse.json(
            { error: "RecordNotFound", message: "Could not locate record" },
            { status: 400 },
          ),
        ),
        http.post(xrpcUrl("com.atproto.repo.createRecord"), () =>
          HttpResponse.json({
            uri: `at://${did}/app.bsky.actor.link/new`,
            cid,
          }),
        ),
        http.post(xrpcUrl("com.atproto.repo.putRecord"), put),
      );
      // act
      const actual = bskyLinkPdsRepository.replace(
        did,
        Array.from({ length: 11 }, () => ({ url: "https://example.com" })),
      );
      // assert
      await expect(actual).rejects.toThrow(BskyLinkInvalidError);
      expect(put).not.toHaveBeenCalled();
    });

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
            { url: "https://example.com" },
          ]);
          // assert
          await expect(actual).rejects.toThrow(expected);
        },
      );
    });
  });
});
