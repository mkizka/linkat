import { createCookieSessionStorage } from "@remix-run/node"; // or cloudflare/deno

import { env } from "~/utils/env";

type SessionData = {
  did: string;
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      secrets: [env.COOKIE_SECRET],
    },
  });

export { commitSession, destroySession, getSession };
