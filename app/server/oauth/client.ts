import { JoseKey } from "@atproto/jwk-jose";
import { NodeOAuthClient } from "@atproto/oauth-client-node";

import { env, isProduction } from "~/utils/env";

import { SessionStore, StateStore } from "./storage";

let oauthClient: NodeOAuthClient | null = null;

export const createOAuthClient = async () => {
  if (oauthClient) {
    return oauthClient;
  }
  const baseUrl = isProduction ? env.PUBLIC_URL : "http://127.0.0.1:3000";
  const privateKeyPKCS8 = Buffer.from(
    env.PRIVATE_KEY_ES256_B64,
    "base64",
  ).toString();
  const privateKey = await JoseKey.fromImportable(privateKeyPKCS8, "key1");
  oauthClient = new NodeOAuthClient({
    clientMetadata: {
      client_name: "Linkat",
      client_id: isProduction
        ? `${env.PUBLIC_URL}/client-metadata.json`
        : `http://localhost?redirect_uri=${encodeURIComponent(`${baseUrl}/oauth/callback`)}`,
      client_uri: baseUrl,
      jwks_uri: `${baseUrl}/jwks.json`,
      redirect_uris: [`${baseUrl}/oauth/callback`],
      scope: "atproto transition:generic",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      application_type: "web",
      token_endpoint_auth_method: "private_key_jwt",
      token_endpoint_auth_signing_alg: "ES256",
      dpop_bound_access_tokens: true,
    },
    keyset: [privateKey],
    plcDirectoryUrl: env.ATPROTO_PLC_URL,
    stateStore: new StateStore(),
    sessionStore: new SessionStore(),
    // 以下、開発時用の設定
    // ローカル開発環境ではalice.testという名前を通常didに解決できないため、
    // pnpm patchでhandleResolverを上書き可能にしたうえで、ローカル環境のbsky AppViewを使用してハンドルを解決している
    // 参照：https://github.com/bluesky-social/atproto/blob/670b6b5de2bf91e6944761c98eb1126fb6a681ee/packages/oauth/oauth-client/src/oauth-client.ts#L212-L215
    handleResolver: !isProduction ? env.BSKY_PUBLIC_API_URL : undefined,
    allowHttp: !isProduction, // httpを許可しないとOAuthProtectedResourceMetadataResolverがエラーを投げる
  });
  return oauthClient;
};
