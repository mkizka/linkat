import { LinkatAgent } from "~/libs/agent";
import { atpassportClient } from "~/server/infrastructure/atpassportClient";
import {
  atpstateCookie,
  commitSession,
  destroySession,
  getSession as getCookieSession,
} from "~/server/infrastructure/cookie";
import { oauthClient } from "~/server/infrastructure/oauthClient";
import { userService } from "~/server/service/userService";

export { atpstateCookie, commitSession, destroySession };

export const getSession = (request: Request) => {
  return getCookieSession(request.headers.get("Cookie"));
};

export const getSessionUserDid = async (request: Request) => {
  const session = await getSession(request);
  if (!session.data.did) {
    return null;
  }
  return session.data.did;
};

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

export const authorize = (handle: string) => oauthClient.authorize(handle);

export const handleCallback = (params: URLSearchParams) =>
  oauthClient.callback(params);

export const getClientMetadata = () => oauthClient.clientMetadata;

export const getJwks = () => oauthClient.jwks;

export const generateAtpassportAuthUrl = () =>
  atpassportClient.generateAuthUrl();

export const parseAtpassportCallback = (url: string, atpstate: string) =>
  atpassportClient.parseCallback(url, atpstate);
