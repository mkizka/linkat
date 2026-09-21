import type { Did } from "@atproto/did";
import { createCookieSessionStorage } from "react-router";

import { env } from "~/utils/env";

const storage = createCookieSessionStorage<{ did: Did }>({
  cookie: {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
    secrets: [env.COOKIE_SECRET],
  },
});

const getSession = (request: Request) =>
  storage.getSession(request.headers.get("Cookie"));

export interface CookieSessionStorage {
  getDid: (request: Request) => Promise<Did | null>;
  // 戻り値は Set-Cookie ヘッダーの値
  commit: (request: Request, did: Did) => Promise<string>;
  destroy: (request: Request) => Promise<string>;
}

export const cookieSessionStorage: CookieSessionStorage = {
  getDid: async (request) => (await getSession(request)).data.did ?? null,
  commit: async (request, did) => {
    const session = await getSession(request);
    session.set("did", did);
    return storage.commitSession(session);
  },
  destroy: async (request) => storage.destroySession(await getSession(request)),
};
