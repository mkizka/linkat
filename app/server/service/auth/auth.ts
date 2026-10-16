import type { Did } from "@atproto/did";

import {
  type IOAuthClient,
  OAuthAccessDeniedError,
} from "~/server/infrastructure/auth/oauthClient";

const exportState = "export";

export class ExportAuthorizationDeniedError extends Error {
  constructor(cause: unknown) {
    super("書き出しの許可が拒否されました", { cause });
  }
}

export interface IAuthService {
  authorize: (handle: string) => Promise<URL>;
  authorizeExport: (did: Did) => Promise<URL>;
  handleCallback: (url: string) => Promise<{ did: Did; toExport: boolean }>;
  canExport: (did: Did) => Promise<boolean>;
  getClientMetadata: () => IOAuthClient["clientMetadata"];
  getJwks: () => IOAuthClient["jwks"];
}

export const authServiceFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IAuthService => ({
  authorize: (handle) => oauthClient.authorize(handle),
  authorizeExport: (did) => oauthClient.authorize(did, exportState),
  async handleCallback(url) {
    const params = new URL(url).searchParams;
    try {
      const { did, state } = await oauthClient.callback(params);
      return { did, toExport: state === exportState };
    } catch (error) {
      if (
        error instanceof OAuthAccessDeniedError &&
        error.state === exportState
      ) {
        throw new ExportAuthorizationDeniedError(error);
      }
      throw error;
    }
  },
  canExport: (did) => oauthClient.canWriteBskyLinks(did),
  getClientMetadata: () => oauthClient.clientMetadata,
  getJwks: () => oauthClient.jwks,
});
