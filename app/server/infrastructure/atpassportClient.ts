import { AtPassport } from "@atpassport/client/core";
import { createCookie } from "react-router";

import { env } from "~/utils/env";

const atpassport = new AtPassport({
  callbackUrl: `${env.PUBLIC_URL}/login/atpassport/callback`,
});

const atpstateCookie = createCookie("atpstate", {
  httpOnly: true,
  maxAge: 60 * 5, // CSRF対策用の一時的な値を保持するだけなので短め
  secure: process.env.NODE_ENV === "production",
  secrets: [env.COOKIE_SECRET],
});

export interface AtpassportClient {
  // setCookie は Set-Cookie ヘッダーの値
  startLogin: () => Promise<{ url: string; setCookie: string }>;
  // atpstate Cookie が無い、または handle が空なら null。検証に失敗したら throw
  verifyCallback: (
    url: string,
    cookieHeader: string | null,
  ) => Promise<string | null>;
}

export const atpassportClient: AtpassportClient = {
  startLogin: async () => {
    const { url, atpstate } = atpassport.generateAuthUrl();
    return { url, setCookie: await atpstateCookie.serialize(atpstate) };
  },
  verifyCallback: async (url, cookieHeader) => {
    const atpstate: unknown = await atpstateCookie.parse(cookieHeader);
    if (typeof atpstate !== "string") {
      return null;
    }
    const { username } = atpassport.parseCallback(url, atpstate);
    return username || null;
  },
};
