import type { Did } from "@atproto/did";

import type { IOAuthClient } from "~/server/infrastructure/oauthClient";

export interface IAuthService {
  authorize: (handle: string) => Promise<URL>;
  handleCallback: (url: string) => Promise<Did>;
  getClientMetadata: () => IOAuthClient["clientMetadata"];
  getJwks: () => IOAuthClient["jwks"];
}

export const authServiceFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IAuthService => ({
  authorize: (handle) => oauthClient.authorize(handle),
  handleCallback: (url) => {
    const params = new URL(url).searchParams;
    return oauthClient.callback(params);
  },
  getClientMetadata: () => oauthClient.clientMetadata,
  getJwks: () => oauthClient.jwks,
});
