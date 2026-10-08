import type { Did } from "@atproto/did";

import type { ICookieSessionStorage } from "~/server/infrastructure/cookieSessionStorage";
import { createLogger } from "~/server/infrastructure/logger";
import {
  type IOAuthClient,
  OAuthSessionInvalidError,
} from "~/server/infrastructure/oauthClient";

const logger = createLogger("sessionService");

export interface ISessionService {
  getSessionDid: (request: Request) => Promise<Did | null>;
  createSession: (request: Request, did: Did) => Promise<string>;
  destroySession: (request: Request) => Promise<string>;
}

export const sessionServiceFactory = ({
  cookieSessionStorage,
  oauthClient,
}: {
  cookieSessionStorage: ICookieSessionStorage;
  oauthClient: IOAuthClient;
}): ISessionService => {
  const getCookieDid = (request: Request) =>
    cookieSessionStorage.getDid(request.headers.get("Cookie"));

  return {
    async getSessionDid(request) {
      const ownerDid = await getCookieDid(request);
      if (!ownerDid) {
        return null;
      }
      try {
        await oauthClient.restore(ownerDid);
        return ownerDid;
      } catch (error) {
        if (error instanceof OAuthSessionInvalidError) {
          return null;
        }
        throw error;
      }
    },
    createSession: (request, did) =>
      cookieSessionStorage.commit(request.headers.get("Cookie"), did),
    async destroySession(request) {
      const ownerDid = await getCookieDid(request);
      if (ownerDid) {
        await oauthClient.revoke(ownerDid).catch((error: unknown) => {
          logger.error("OAuthセッションの失効に失敗しました", { error });
        });
      }
      return cookieSessionStorage.destroy(request.headers.get("Cookie"));
    },
  };
};
