import { asDid, type Did, isDid } from "@atproto/did";
import { OAuthResolverError } from "@atproto/oauth-client-node";

import { LinkatAgent } from "~/libs/agent";
import { User } from "~/models/user";
import type { Registry } from "~/server/di";
import { oauthClientFactory } from "~/server/infrastructure/oauthClient";
import { env } from "~/utils/env";

// モックが解決出来るハンドルのTLD。これ以外はOAuthのハンドル解決に失敗させる
const MOCKED_TLD = ".test";

// ハンドルとDIDを相互に変換出来るようにして、テストごとに独立したユーザーを使えるようにする
const didFromHandle = (handle: string) => asDid(`did:web:${handle}`);
const handleFromDid = (did: Did) => did.replace("did:web:", "");

// PDSへの書き込みは成功したことにする
// 書き込んだレコードを検証するテストは実際のPDSに繋ぐlargeテストで行う
const mockPdsResponse = (path: `/${string}`) => {
  if (path.startsWith("/xrpc/com.atproto.repo.putRecord")) {
    return Response.json({
      uri: "at://did:web:example.test/blue.linkat.board/self",
      cid: "bafyreidfayvfuwqa7qlnopdjiqrxzs6blmoeu4rujcjtnci5beludirz2a",
    });
  }
  if (path.startsWith("/xrpc/com.atproto.repo.deleteRecord")) {
    return Response.json({});
  }
  return Response.json({ error: "NotImplemented" }, { status: 501 });
};

const fetchHandler = (path: `/${string}`) =>
  Promise.resolve(mockPdsResponse(path));

export const replaceWithMocks = (registry: Registry) =>
  registry
    .replaceService(
      "oauthClient",
      ["oauthStateStore", "oauthSessionStore"],
      (deps) => ({
        // client-metadata.jsonなどを返すためのプロパティは本物を使う
        ...oauthClientFactory(deps),
        authorize(handle: string) {
          if (!handle.endsWith(MOCKED_TLD)) {
            return Promise.reject(
              new OAuthResolverError(
                `モックでは${MOCKED_TLD}で終わるハンドルしか解決出来ません: ${handle}`,
              ),
            );
          }
          // 認可画面を経由せずコールバックに直接戻す
          return Promise.resolve(
            new URL(`/oauth/callback?handle=${handle}`, env.PUBLIC_URL),
          );
        },
        callback(params: URLSearchParams) {
          const handle = params.get("handle");
          if (!handle) {
            return Promise.reject(new Error("handleパラメータがありません"));
          }
          return Promise.resolve(didFromHandle(handle));
        },
        restore(did: Did) {
          return Promise.resolve(new LinkatAgent({ did, fetchHandler }));
        },
      }),
    )
    .replaceService(
      "userService",
      ["userRepository"],
      ({ userRepository }) => ({
        async findOrFetchUser({ handleOrDid }: { handleOrDid: string }) {
          const user = isDid(handleOrDid)
            ? await userRepository.findByDid(handleOrDid)
            : await userRepository.findByHandle(handleOrDid);
          if (user) {
            return user;
          }
          // モックが作るDID以外は存在しないユーザーとして扱う
          if (isDid(handleOrDid) && !handleOrDid.startsWith("did:web:")) {
            return null;
          }
          const handle = isDid(handleOrDid)
            ? handleFromDid(handleOrDid)
            : handleOrDid;
          if (!handle.endsWith(MOCKED_TLD)) {
            return null;
          }
          // プロフィールはBlueskyから取得せずハンドルから作る
          const newUser = new User({
            did: didFromHandle(handle),
            avatar: null,
            description: null,
            displayName: handle,
            handle,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          await userRepository.save(newUser);
          return newUser;
        },
      }),
    )
    .replaceService("didService", () => ({
      // PDSを持たないユーザーなので解決出来ないことにし、ボードはDBのものだけを使う
      resolveServiceUrl: () => Promise.resolve(null),
    }));
