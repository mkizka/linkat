import { LinkatAgent } from "~/libs/agent";
import {
  commitSession,
  destroySession,
  getSession as getCookieSession,
} from "~/server/infrastructure/cookie";
import { oauthClient } from "~/server/infrastructure/oauthClient";
import { userService } from "~/server/service/userService";

export { commitSession, destroySession };

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
