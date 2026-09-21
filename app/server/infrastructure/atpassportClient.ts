import { AtPassport } from "@atpassport/client/core";
import { createCookie } from "react-router";

import { env } from "~/utils/env";

export const atpassport = new AtPassport({
  callbackUrl: `${env.PUBLIC_URL}/login/atpassport/callback`,
});

export const atpstateCookie = createCookie("atpstate", {
  httpOnly: true,
  maxAge: 60 * 5, // CSRF対策用の一時的な値を保持するだけなので短め
  secure: process.env.NODE_ENV === "production",
  secrets: [env.COOKIE_SECRET],
});
