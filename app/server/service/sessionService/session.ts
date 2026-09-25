import type { Did } from "@atproto/did";

import type { LinkatAgent } from "~/libs/agent";
import type { User } from "~/models/user";
import type { ICookieSessionStorage } from "~/server/infrastructure/cookieSessionStorage";
import type { IOAuthClient } from "~/server/infrastructure/oauthClient";
import type { IUserService } from "~/server/service/userService/user";

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
  const getSessionUserDid = (request: Request) =>
    cookieSessionStorage.getDid(request.headers.get("Cookie"));

  return {
    getSessionUserDid,
    createSession: (request, did) =>
      cookieSessionStorage.commit(request.headers.get("Cookie"), did),
    destroySession: (request) =>
      cookieSessionStorage.destroy(request.headers.get("Cookie")),
    async getSessionUser(request) {
      const userDid = await getSessionUserDid(request);
      if (!userDid) {
        return null;
      }
      return await userService.findOrFetchUser({ handleOrDid: userDid });
    },
    async getSessionAgent(request) {
      const userDid = await getSessionUserDid(request);
      if (!userDid) {
        return null;
      }
      return await oauthClient.restore(userDid);
    },
  };
};
