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

export interface ICookieSessionStorage {
  getDid: (cookieHeader: string | null) => Promise<Did | null>;
  // 戻り値は Set-Cookie ヘッダーの値
  commit: (cookieHeader: string | null, did: Did) => Promise<string>;
  destroy: (cookieHeader: string | null) => Promise<string>;
}

export const cookieSessionStorageFactory = (): ICookieSessionStorage => ({
  async getDid(cookieHeader) {
    const session = await storage.getSession(cookieHeader);
    return session.data.did ?? null;
  },
  async commit(cookieHeader, did) {
    const session = await storage.getSession(cookieHeader);
    session.set("did", did);
    return storage.commitSession(session);
  },
  async destroy(cookieHeader) {
    const session = await storage.getSession(cookieHeader);
    return storage.destroySession(session);
  },
});
