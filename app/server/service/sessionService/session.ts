import { LinkatAgent } from "~/libs/agent";
import { cookieSessionStorage } from "~/server/infrastructure/cookieSessionStorage";
import { oauthClient } from "~/server/infrastructure/oauthClient";
import { userService } from "~/server/service/userService";

export const getSessionUserDid = (request: Request) =>
  cookieSessionStorage.getDid(request);

export const createSession = cookieSessionStorage.commit;

export const destroySession = cookieSessionStorage.destroy;

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
