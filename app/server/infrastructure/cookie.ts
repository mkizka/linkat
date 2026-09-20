import type { Did } from "@atproto/did";
import { createCookie, createCookieSessionStorage } from "react-router"; // or cloudflare/deno

import { env } from "~/utils/env";

type SessionData = {
  did: Did;
};

type SessionFlashData = {
  error: string;
};

export const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    cookie: {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60,
      secure: process.env.NODE_ENV === "production",
      secrets: [env.COOKIE_SECRET],
    },
  });

export const atpstateCookie = createCookie("atpstate", {
  httpOnly: true,
  maxAge: 60 * 5, // CSRF対策用の一時的な値を保持するだけなので短め
  secure: process.env.NODE_ENV === "production",
  secrets: [env.COOKIE_SECRET],
});
