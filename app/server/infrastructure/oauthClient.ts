import type { Did } from "@atproto/did";
import { JoseKey } from "@atproto/jwk-jose";
import type {
  NodeSavedSessionStore,
  NodeSavedStateStore,
  OAuthClientMetadataInput,
  OAuthSession,
} from "@atproto/oauth-client-node";
import {
  atprotoLoopbackClientMetadata,
  NodeOAuthClient,
} from "@atproto/oauth-client-node";

import { env, isProduction } from "~/utils/env";

const privateKey = Buffer.from(env.PRIVATE_KEY_ES256_B64, "base64").toString();

const scope = "atproto include:blue.linkat.permissionSet";

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

export interface IOAuthClient {
  authorize: (handle: string) => Promise<URL>;
  callback: (params: URLSearchParams) => Promise<Did>;
  restore: (did: Did) => Promise<OAuthSession>;
  clientMetadata: NodeOAuthClient["clientMetadata"];
  jwks: NodeOAuthClient["jwks"];
}

export const oauthClientFactory = ({
  oauthStateStore,
  oauthSessionStore,
}: {
  oauthStateStore: NodeSavedStateStore;
  oauthSessionStore: NodeSavedSessionStore;
}): IOAuthClient => {
  const client = new NodeOAuthClient({
    clientMetadata,
    keyset,
    plcDirectoryUrl: env.ATPROTO_PLC_URL,
    stateStore: oauthStateStore,
    sessionStore: oauthSessionStore,
  });

  return {
    authorize: (handle) => client.authorize(handle, { scope }),
    async callback(params) {
      const { session } = await client.callback(params);
      return session.did;
    },
    restore: (did) => client.restore(did),
    get clientMetadata() {
      return client.clientMetadata;
    },
    get jwks() {
      return client.jwks;
    },
  };
};
