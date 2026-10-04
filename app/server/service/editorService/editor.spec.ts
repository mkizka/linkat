import { asDid } from "@atproto/did";
import { http, HttpResponse } from "msw";

import { LinkatAgent } from "~/libs/agent";
import { server } from "~/mocks/server";
import { Owner } from "~/models/owner";
import { OwnerFactory } from "~/server/factories/owner";
import { db } from "~/server/infrastructure/drizzle";
import { ownerDbRepositoryFactory } from "~/server/infrastructure/ownerDbRepository";
import { profileFetcherFactory } from "~/server/infrastructure/profileFetcher";
import { profileRecordParserFactory } from "~/server/infrastructure/profileRecordParser";

import { editorServiceFactory } from "./editor";

const ownerDbRepository = ownerDbRepositoryFactory({ db });
const editorService = editorServiceFactory({
  ownerDbRepository,
  profileFetcher: profileFetcherFactory({
    profileRecordParser: profileRecordParserFactory(),
  }),
});

const AVATAR_CID =
  "bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy";

const getRecordUrl = "https://pds.example.com/xrpc/com.atproto.repo.getRecord";

const createAgent = (did: string) =>
  new LinkatAgent({ did: asDid(did), service: "https://pds.example.com" });

describe("editorService", () => {
  describe("findView", () => {
    test("持ち主の写しがあれば、それを返す", async () => {
      // arrange
      const owner = await OwnerFactory.create();
      // act
      const actual = await editorService.findView(createAgent(owner.did));
      // assert
      expect(actual).toEqual(new Owner(owner).toView());
    });
    test("写しが無ければ、DIDとセッションのPDSから取得したプロフィールを返し、保存しない", async () => {
      // arrange
      const did = "did:plc:editor";
      let requestedRepo: string | null = null;
      server.use(
        http.get(getRecordUrl, ({ request }) => {
          requestedRepo = new URL(request.url).searchParams.get("repo");
          return HttpResponse.json({
            uri: `at://${did}/app.bsky.actor.profile/self`,
            cid: "bafyreidfayvfuwqa7qlnopdjiqrxzs6blmoeu4rujcjtnci5beludirz2a",
            value: {
              $type: "app.bsky.actor.profile",
              displayName: "Alice",
              avatar: {
                $type: "blob",
                ref: { $link: AVATAR_CID },
                mimeType: "image/jpeg",
                size: 1000,
              },
            },
          });
        }),
      );
      // act
      const actual = await editorService.findView(createAgent(did));
      // assert
      expect(actual).toEqual({
        did,
        handleOrDid: did,
        displayHandle: `@${did}`,
        displayName: "Alice",
        avatarUrl: `https://cdn.bsky.app/img/avatar/plain/${did}/${AVATAR_CID}@jpeg`,
      });
      expect(requestedRepo).toBe(did);
      expect(await ownerDbRepository.findByDid(asDid(did))).toBeNull();
    });
    test("写しが無くプロフィールの取得にも失敗したら、DIDだけを返す", async () => {
      // arrange
      const did = "did:plc:editor";
      server.use(
        http.get(getRecordUrl, () =>
          HttpResponse.json({ error: "InternalServerError" }, { status: 500 }),
        ),
      );
      // act
      const actual = await editorService.findView(createAgent(did));
      // assert
      expect(actual).toEqual({
        did,
        handleOrDid: did,
        displayHandle: `@${did}`,
        displayName: null,
        avatarUrl: null,
      });
      expect(await ownerDbRepository.findByDid(asDid(did))).toBeNull();
    });
  });
});
