import { JoseKey } from "@atproto/jwk-jose";
import { NodeOAuthClient } from "@atproto/oauth-client-node";

import { env, isProduction } from "~/utils/env";

import { SessionStore, StateStore } from "./storage";

const baseUrl = isProduction ? env.PUBLIC_URL : "http://127.0.0.1:3000";

const privateKeyPKCS8 = Buffer.from(
  env.PRIVATE_KEY_ES256_B64,
  "base64",
).toString();

const privateKey = await JoseKey.fromImportable(privateKeyPKCS8, "key1");

export const oauthClient = new NodeOAuthClient({
  clientMetadata: {
    client_name: "Linkat",
    client_id: isProduction
      ? `${env.PUBLIC_URL}/client-metadata.json`
      : `http://localhost?redirect_uri=${encodeURIComponent(`${baseUrl}/oauth/callback`)}`,
    client_uri: env.PUBLIC_URL,
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
  // @ts-expect-error
  handleResolver: env.BSKY_PUBLIC_API_URL,
  stateStore: new StateStore(),
  sessionStore: new SessionStore(),
});
