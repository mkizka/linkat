import { NodeOAuthClient } from "@atproto/oauth-client-node";

import { env, isProduction } from "~/utils/env";

import { SessionStore, StateStore } from "./storage";

const baseUrl = isProduction ? env.PUBLIC_URL : "http://127.0.0.1:3000";

export const oauthClient = new NodeOAuthClient({
  clientMetadata: {
    client_name: "Linkat",
    client_id: isProduction
      ? `${env.PUBLIC_URL}/client-metadata.json`
      : `http://localhost?redirect_uri=${encodeURIComponent(`${baseUrl}/oauth/callback`)}`,
    client_uri: env.PUBLIC_URL,
    redirect_uris: [`${baseUrl}/oauth/callback`],
    scope: "atproto transition:generic",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    application_type: "web",
    token_endpoint_auth_method: "none",
    dpop_bound_access_tokens: true,
  },
  plcDirectoryUrl: env.ATPROTO_PCL_URL,
  // @ts-expect-error
  handleResolver: env.BSKY_APPVIEW_URL,
  stateStore: new StateStore(),
  sessionStore: new SessionStore(),
});
