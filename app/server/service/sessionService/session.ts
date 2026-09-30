import type { Did } from "@atproto/did";

import { LinkatAgent } from "~/libs/agent";
import type { User } from "~/models/user";
import type { ICookieSessionStorage } from "~/server/infrastructure/cookieSessionStorage";
import {
  type IOAuthClient,
  OAuthSessionInvalidError,
} from "~/server/infrastructure/oauthClient";
import type { IUserService } from "~/server/service/userService/user";
import { createLogger } from "~/utils/logger";

const logger = createLogger("sessionService");

export interface ISessionService {
  getSessionUserDid: (request: Request) => Promise<Did | null>;
  createSession: (request: Request, did: Did) => Promise<string>;
  destroySession: (request: Request) => Promise<string>;
  getSessionUser: (request: Request) => Promise<User | null>;
  getSessionAgent: (request: Request) => Promise<LinkatAgent | null>;
}

export const sessionServiceFactory = ({
  cookieSessionStorage,
  oauthClient,
  userService,
}: {
  cookieSessionStorage: ICookieSessionStorage;
  oauthClient: IOAuthClient;
  userService: IUserService;
}): ISessionService => {
  const getCookieDid = (request: Request) =>
    cookieSessionStorage.getDid(request.headers.get("Cookie"));

  const getSessionAgent = async (request: Request) => {
    const userDid = await getCookieDid(request);
    if (!userDid) {
      return null;
    }
    try {
      return new LinkatAgent(await oauthClient.restore(userDid));
    } catch (error) {
      if (error instanceof OAuthSessionInvalidError) {
        return null;
      }
      throw error;
    }
  };

  const getSessionUserDid = async (request: Request) =>
    (await getSessionAgent(request))?.assertDid ?? null;

  return {
    getSessionUserDid,
    getSessionAgent,
    createSession: (request, did) =>
      cookieSessionStorage.commit(request.headers.get("Cookie"), did),
    async destroySession(request) {
      const userDid = await getCookieDid(request);
      if (userDid) {
        await oauthClient.revoke(userDid).catch((error: unknown) => {
          logger.error(error, "OAuthセッションの失効に失敗しました");
        });
      }
      return cookieSessionStorage.destroy(request.headers.get("Cookie"));
    },
    async getSessionUser(request) {
      const userDid = await getSessionUserDid(request);
      if (!userDid) {
        return null;
      }
      return await userService.findUser({ handleOrDid: userDid });
    },
  };
};
