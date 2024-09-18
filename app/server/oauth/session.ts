import { createCookieSessionStorage } from "@remix-run/node"; // or cloudflare/deno

import { LinkatAgent } from "~/libs/agent";
import { userService } from "~/server/service/userService";
import { env } from "~/utils/env";

import { oauthClient } from "./client";

type SessionData = {
  did: string;
};

type SessionFlashData = {
  error: string;
};

const {
  getSession: _getSession,
  commitSession,
  destroySession,
} = createCookieSessionStorage<SessionData, SessionFlashData>({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    secrets: [env.COOKIE_SECRET],
  },
});

export { commitSession, destroySession };

export const getSession = (request: Request) => {
  return _getSession(request.headers.get("Cookie"));
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
