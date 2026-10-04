import type { Did } from "@atproto/did";

import { LinkatAgent } from "~/libs/agent";
import type { ICookieSessionStorage } from "~/server/infrastructure/cookieSessionStorage";
import {
  type IOAuthClient,
  OAuthSessionInvalidError,
} from "~/server/infrastructure/oauthClient";
import { createLogger } from "~/utils/logger";

const logger = createLogger("sessionService");

export interface ISessionService {
  getSessionDid: (request: Request) => Promise<Did | null>;
  createSession: (request: Request, did: Did) => Promise<string>;
  destroySession: (request: Request) => Promise<string>;
  getSessionAgent: (request: Request) => Promise<LinkatAgent | null>;
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

  const getSessionAgent = async (request: Request) => {
    const ownerDid = await getCookieDid(request);
    if (!ownerDid) {
      return null;
    }
    try {
      return new LinkatAgent(await oauthClient.restore(ownerDid));
    } catch (error) {
      if (error instanceof OAuthSessionInvalidError) {
        return null;
      }
      throw error;
    }
  };

  const getSessionDid = async (request: Request) =>
    (await getSessionAgent(request))?.assertDid ?? null;

  return {
    getSessionDid,
    getSessionAgent,
    createSession: (request, did) =>
      cookieSessionStorage.commit(request.headers.get("Cookie"), did),
    async destroySession(request) {
      const ownerDid = await getCookieDid(request);
      if (ownerDid) {
        await oauthClient.revoke(ownerDid).catch((error: unknown) => {
          logger.error(error, "OAuthセッションの失効に失敗しました");
        });
      }
      return cookieSessionStorage.destroy(request.headers.get("Cookie"));
    },
  };
};
