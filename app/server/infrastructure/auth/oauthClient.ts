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
  NodeOAuthClient,
  OAuthCallbackError,
  TokenRefreshError,
} from "@atproto/oauth-client-node";
import { ScopePermissionsTransition } from "@atproto/oauth-scopes";

import { env, isProduction } from "~/utils/env";

const privateKey = Buffer.from(env.PRIVATE_KEY_ES256_B64, "base64").toString();

const scope = [
  "atproto",
  "include:blue.linkat.permissionSet",
  "repo:app.bsky.actor.link?action=create&action=delete",
  "repo:app.bsky.actor.profile?action=create&action=update",
].join(" ");

const bskyLinkPermissions = [
  { collection: "app.bsky.actor.link", action: "create" },
  { collection: "app.bsky.actor.link", action: "delete" },
  { collection: "app.bsky.actor.profile", action: "create" },
  { collection: "app.bsky.actor.profile", action: "update" },
] as const;

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

export class OAuthAccessDeniedError extends Error {
  constructor(
    readonly state: string | null,
    cause: unknown,
  ) {
    super("OAuthの許可が拒否されました", { cause });
  }
}

export interface IOAuthClient {
  authorize: (input: string, state?: string) => Promise<URL>;
  callback: (
    params: URLSearchParams,
  ) => Promise<{ did: Did; state: string | null }>;
  restore: (did: Did) => Promise<Agent>;
  canWriteBskyLinks: (did: Did) => Promise<boolean>;
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

  const restore = async (did: Did) => {
    try {
      return await client.restore(did);
    } catch (error) {
      if (error instanceof TokenRefreshError) {
        throw new OAuthSessionInvalidError(error);
      }
      throw error;
    }
  };

  return {
    authorize: (input, state) => client.authorize(input, { scope, state }),
    async callback(params) {
      try {
        const { session, state } = await client.callback(params);
        return { did: session.did, state };
      } catch (error) {
        if (
          error instanceof OAuthCallbackError &&
          error.params.get("error") === "access_denied"
        ) {
          throw new OAuthAccessDeniedError(error.state ?? null, error);
        }
        throw error;
      }
    },
    restore,
    async canWriteBskyLinks(did) {
      const session = await restore(did);
      const permissions = new ScopePermissionsTransition(
        (await session.getTokenInfo()).scope,
      );
      return bskyLinkPermissions.every((permission) =>
        permissions.allowsRepo(permission),
      );
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
