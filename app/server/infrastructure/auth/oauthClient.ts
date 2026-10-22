import type { Did } from "@atproto/did";
import { JoseKey } from "@atproto/jwk-jose";
import type { Agent } from "@atproto/lex";
import type {
  NodeSavedSessionStore,
  NodeSavedStateStore,
  OAuthClientMetadataInput,
} from "@atproto/oauth-client-node";
import {
  atprotoLoopbackClientMetadata,
  isExpectedSessionError,
  NodeOAuthClient,
  OAuthResponseError,
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

export class OAuthSessionInvalidError extends Error {
  constructor(cause: unknown) {
    super("OAuthセッションが無効です", { cause });
  }
}

const isSessionInvalidError = (error: unknown) =>
  isExpectedSessionError(error) ||
  (error instanceof OAuthResponseError &&
    error.status >= 400 &&
    error.status < 500 &&
    (error.error === "invalid_client" || error.error === "invalid_grant"));

export interface IOAuthClient {
  authorize: (handle: string, state?: string) => Promise<URL>;
  callback: (
    params: URLSearchParams,
  ) => Promise<{ did: Did; state: string | null }>;
  restore: (did: Did) => Promise<Agent>;
  revoke: (did: Did) => Promise<void>;
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
    handleResolver: env.ATPROTO_HANDLE_RESOLVER_URL,
    allowHttp: !isProduction,
    stateStore: oauthStateStore,
    sessionStore: oauthSessionStore,
  });

  return {
    authorize: (handle, state) => client.authorize(handle, { scope, state }),
    async callback(params) {
      const { session, state } = await client.callback(params);
      return { did: session.did, state };
    },
    async restore(did) {
      try {
        return await client.restore(did);
      } catch (error) {
        if (isSessionInvalidError(error)) {
          throw new OAuthSessionInvalidError(error);
        }
        throw error;
      }
    },
    revoke: (did) => client.revoke(did),
    get clientMetadata() {
      return client.clientMetadata;
    },
    get jwks() {
      return client.jwks;
    },
  };
};
