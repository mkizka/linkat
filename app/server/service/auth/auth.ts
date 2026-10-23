import type { Did } from "@atproto/did";

import {
  type IOAuthClient,
  OAuthCallbackFailedError,
} from "~/server/infrastructure/auth/oauthClient";

const toSafeRedirectPath = (value: string | undefined) => {
  if (!value?.startsWith("/")) return "/";
  const base = "http://localhost";
  const url = new URL(value, base);
  if (url.origin !== base) return "/";
  return url.pathname + url.search + url.hash;
};

export class AuthCallbackError extends Error {
  constructor(
    readonly returnTo: string,
    readonly denied: boolean,
    cause: unknown,
  ) {
    super("ログインのコールバックに失敗しました", { cause });
  }
}

export interface IAuthService {
  authorize: (
    handleOrDid: string,
    options: Parameters<IOAuthClient["authorize"]>[1],
  ) => Promise<URL>;
  handleCallback: (url: string) => Promise<{ did: Did; redirectTo: string }>;
  canExport: (did: Did) => Promise<boolean>;
  getClientMetadata: () => IOAuthClient["clientMetadata"];
  getJwks: () => IOAuthClient["jwks"];
}

export const authServiceFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IAuthService => ({
  authorize: (handleOrDid, options) =>
    oauthClient.authorize(handleOrDid, options),
  async handleCallback(url) {
    const params = new URL(url).searchParams;
    try {
      const { did, redirect } = await oauthClient.callback(params);
      return { did, redirectTo: toSafeRedirectPath(redirect) };
    } catch (error) {
      if (error instanceof OAuthCallbackFailedError) {
        throw new AuthCallbackError(
          toSafeRedirectPath(error.from),
          error.denied,
          error,
        );
      }
      throw error;
    }
  },
  canExport: (did) => oauthClient.canWriteBskyLinks(did),
  getClientMetadata: () => oauthClient.clientMetadata,
  getJwks: () => oauthClient.jwks,
});
