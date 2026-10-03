import { asDid } from "@atproto/did";
import { http, HttpResponse } from "msw";
import { mock } from "vitest-mock-extended";

import { LinkatAgent } from "~/libs/agent";
import { server } from "~/mocks/server";
import { User } from "~/models/user";
import { UserFactory } from "~/server/factories/user";
import { accountPdsRepositoryFactory } from "~/server/infrastructure/accountPdsRepository";
import { db } from "~/server/infrastructure/drizzle";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import { profileRecordParserFactory } from "~/server/infrastructure/profileRecordParser";
import { userDbRepositoryFactory } from "~/server/infrastructure/userDbRepository";
import { userRepositoryFactory } from "~/server/infrastructure/userRepository";

import { userServiceFactory } from "./user";

const identityResolver = mock<IIdentityResolver>();
const userDbRepository = userDbRepositoryFactory({ db });
const accountPdsRepository = accountPdsRepositoryFactory({
  identityResolver,
  profileRecordParser: profileRecordParserFactory(),
});
const userService = userServiceFactory({
  userRepository: userRepositoryFactory({
    userDbRepository,
    accountPdsRepository,
  }),
  userDbRepository,
  accountPdsRepository,
});

const AVATAR_CID =
  "bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy";

const getRecordUrl = "https://pds.example.com/xrpc/com.atproto.repo.getRecord";

const createAgent = (did: string) =>
  new LinkatAgent({ did: asDid(did), service: "https://pds.example.com" });

describe("userService", () => {
  describe("findUser", () => {
    test("ユーザーを取得できる", async () => {
      // arrange
      const user = await UserFactory.create();
      // act
      const actual = await userService.findUser({ handleOrDid: user.did });
      // assert
      expect(actual).toEqual(user);
    });
    test("入力が明らかにドメインでなければnullを返す", async () => {
      // arrange
      // act
      const actual = await userService.findUser({
        handleOrDid: "invalid",
      });
      // assert
      expect(actual).toBeNull();
    });
    test("入力がDIDとして不正であればnullを返す", async () => {
      // arrange
      // act
      const actual = await userService.findUser({
        handleOrDid: "did:invalid",
      });
      // assert
      expect(actual).toBeNull();
    });
  });

  describe("findEditor", () => {
    test("持ち主の写しがあれば、それを返す", async () => {
      // arrange
      const user = await UserFactory.create();
      // act
      const actual = await userService.findEditor(createAgent(user.did));
      // assert
      expect(actual).toEqual(new User(user).toView());
      expect(identityResolver.resolve).not.toHaveBeenCalled();
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
      const actual = await userService.findEditor(createAgent(did));
      // assert
      expect(actual).toEqual({
        did,
        handleOrDid: did,
        displayHandle: `@${did}`,
        displayName: "Alice",
        avatarUrl: `https://cdn.bsky.app/img/avatar/plain/${did}/${AVATAR_CID}@jpeg`,
      });
      expect(requestedRepo).toBe(did);
      expect(identityResolver.resolve).not.toHaveBeenCalled();
      expect(await userDbRepository.findByDid(asDid(did))).toBeNull();
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
      const actual = await userService.findEditor(createAgent(did));
      // assert
      expect(actual).toEqual({
        did,
        handleOrDid: did,
        displayHandle: `@${did}`,
        displayName: null,
        avatarUrl: null,
      });
      expect(await userDbRepository.findByDid(asDid(did))).toBeNull();
    });
  });
});
