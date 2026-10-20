import type { Did } from "@atproto/did";

import type { IOAuthClient } from "~/server/infrastructure/auth/oauthClient";

const toSafeRedirectPath = (value: string | null) => {
  if (!value?.startsWith("/")) return "/";
  const base = "http://localhost";
  const url = new URL(value, base);
  if (url.origin !== base) return "/";
  return url.pathname + url.search + url.hash;
};

export interface IAuthService {
  authorize: (handle: string, redirectTo?: string) => Promise<URL>;
  handleCallback: (url: string) => Promise<{ did: Did; redirectTo: string }>;
  getClientMetadata: () => IOAuthClient["clientMetadata"];
  getJwks: () => IOAuthClient["jwks"];
}

export const authServiceFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IAuthService => ({
  authorize: (handle, redirectTo) => oauthClient.authorize(handle, redirectTo),
  async handleCallback(url) {
    const params = new URL(url).searchParams;
    const { did, state } = await oauthClient.callback(params);
    return { did, redirectTo: toSafeRedirectPath(state) };
  },
  getClientMetadata: () => oauthClient.clientMetadata,
  getJwks: () => oauthClient.jwks,
});
