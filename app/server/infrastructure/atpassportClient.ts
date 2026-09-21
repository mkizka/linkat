import { AtPassport } from "@atpassport/client/core";

import { env } from "~/utils/env";

export interface ATPassportClient {
  generateAuthUrl: () => ReturnType<AtPassport["generateAuthUrl"]>;
  parseCallback: (
    url: string,
    atpstate: string,
  ) => ReturnType<AtPassport["parseCallback"]>;
}

const atpassport = new AtPassport({
  callbackUrl: `${env.PUBLIC_URL}/login/atpassport/callback`,
});

export const atpassportClient: ATPassportClient = {
  generateAuthUrl: () => atpassport.generateAuthUrl(),
  parseCallback: (url, atpstate) => atpassport.parseCallback(url, atpstate),
};
