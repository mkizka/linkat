import { AtPassport } from "@atpassport/client/core";

import { atpstateCookie } from "~/server/infrastructure/cookie";
import { env } from "~/utils/env";

export const atpassport = new AtPassport({
  callbackUrl: `${env.PUBLIC_URL}/login/atpassport/callback`,
});

export { atpstateCookie };
