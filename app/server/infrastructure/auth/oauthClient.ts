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
import {
  RepoPermission,
  ScopePermissionsTransition,
} from "@atproto/oauth-scopes";
import { z } from "zod";

import { env, isProduction } from "~/utils/env";

const privateKey = Buffer.from(env.PRIVATE_KEY_ES256_B64, "base64").toString();

const loginScope = "atproto include:blue.linkat.permissionSet";

const bskyLinkPermissions = [
  { collection: "app.bsky.actor.link", action: "create" },
  { collection: "app.bsky.actor.link", action: "delete" },
  { collection: "app.bsky.actor.profile", action: "create" },
  { collection: "app.bsky.actor.profile", action: "update" },
] as const;

const scope = [
  loginScope,
  ...bskyLinkPermissions.map((permission) =>
    RepoPermission.scopeNeededFor(permission),
  ),
].join(" ");

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

const oauthStateSchema = z.object({
  redirect: z.string().optional(),
  from: z.string().optional(),
});

type OAuthState = z.infer<typeof oauthStateSchema>;

export const parseOAuthState = (state: string | null): OAuthState => {
  try {
    return oauthStateSchema.parse(JSON.parse(state ?? ""));
  } catch {
    return {};
  }
};

export class OAuthSessionInvalidError extends Error {
  constructor(cause: unknown) {
    super("OAuthセッションが無効です", { cause });
  }
}

export class OAuthCallbackFailedError extends Error {
  constructor(
    readonly from: string | undefined,
    readonly denied: boolean,
    cause: unknown,
  ) {
    super("OAuthコールバックに失敗しました", { cause });
  }
}

export interface IOAuthClient {
  authorize: (
    handleOrDid: string,
    options: OAuthState & { bskyLinks?: boolean },
  ) => Promise<URL>;
  callback: (
    params: URLSearchParams,
  ) => Promise<{ did: Did; redirect: string | undefined }>;
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
    authorize: (handleOrDid, { bskyLinks, ...state }) =>
      client.authorize(handleOrDid, {
        scope: bskyLinks ? scope : loginScope,
        state: JSON.stringify(state),
      }),
    async callback(params) {
      try {
        const { session, state } = await client.callback(params);
        return { did: session.did, redirect: parseOAuthState(state).redirect };
      } catch (error) {
        if (error instanceof OAuthCallbackError && error.state) {
          throw new OAuthCallbackFailedError(
            parseOAuthState(error.state).from,
            error.params.get("error") === "access_denied",
            error,
          );
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
