import { JoseKey } from "@atproto/jwk-jose";
import type {
  NodeOAuthClientOptions,
  OAuthClientMetadataInput,
} from "@atproto/oauth-client-node";
import {
  atprotoLoopbackClientMetadata,
  NodeOAuthClient,
} from "@atproto/oauth-client-node";

import { env, isProduction } from "~/utils/env";

import { SessionStore, StateStore } from "./storage";

const privateKey = Buffer.from(env.PRIVATE_KEY_ES256_B64, "base64").toString();

const scope = isProduction
  ? "atproto include:blue.linkat.permissionSet"
  : "atproto transition:generic";

const clientMetadata: OAuthClientMetadataInput = isProduction
  ? {
      client_name: "Linkat",
      client_id: `${env.PUBLIC_URL}/client-metadata.json`,
      client_uri: env.PUBLIC_URL,
      jwks_uri: `${env.PUBLIC_URL}/jwks.json`,
      redirect_uris: [`${env.PUBLIC_URL}/oauth/callback`],
      scope,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      application_type: "web",
      token_endpoint_auth_method: "private_key_jwt",
      token_endpoint_auth_signing_alg: "ES256",
      dpop_bound_access_tokens: true,
    }
  : atprotoLoopbackClientMetadata(
      `http://localhost?${new URLSearchParams([
        ["redirect_uri", `http://127.0.0.1:${env.PORT}/oauth/callback`],
        ["scope", scope],
      ])}`,
    );

const keyset = isProduction
  ? [await JoseKey.fromImportable(privateKey, "key1")]
  : undefined;

const oauthClientOptions: NodeOAuthClientOptions = {
  clientMetadata,
  keyset,
  plcDirectoryUrl: env.ATPROTO_PLC_URL,
  stateStore: new StateStore(),
  sessionStore: new SessionStore(),
};

if (!isProduction) {
  oauthClientOptions.handleResolver = env.BSKY_PUBLIC_API_URL;
  oauthClientOptions.allowHttp = true; // httpを許可しないとOAuthProtectedResourceMetadataResolverがエラーを投げる
}

export const oauthClient = new NodeOAuthClient(oauthClientOptions);
