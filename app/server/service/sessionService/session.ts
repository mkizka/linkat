import type { Did } from "@atproto/did";

import { LinkatAgent } from "~/libs/agent";
import { cookieSessionStorage } from "~/server/infrastructure/cookieSessionStorage";
import { oauthClient } from "~/server/infrastructure/oauthClient";
import { userService } from "~/server/service/userService";

export const getSessionUserDid = (request: Request) =>
  cookieSessionStorage.getDid(request.headers.get("Cookie"));

export const createSession = (request: Request, did: Did) =>
  cookieSessionStorage.commit(request.headers.get("Cookie"), did);

export const destroySession = (request: Request) =>
  cookieSessionStorage.destroy(request.headers.get("Cookie"));

export const getSessionUser = async (request: Request) => {
  const userDid = await getSessionUserDid(request);
  if (!userDid) {
    return null;
  }
  return await userService.findOrFetchUser({
    handleOrDid: userDid,
  });
};

export const getSessionAgent = async (request: Request) => {
  const userDid = await getSessionUserDid(request);
  if (!userDid) {
    return null;
  }
  const oauthSession = await oauthClient.restore(userDid);
  return new LinkatAgent(oauthSession);
};
