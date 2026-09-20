import { AtPassport } from "@atpassport/client/core";

import { env } from "~/utils/env";

export interface ATPassportClient {
  generateAuthUrl: () => ReturnType<AtPassport["generateAuthUrl"]>;
  parseCallback: (
    url: string,
    atpstate: string,
  ) => ReturnType<AtPassport["parseCallback"]>;
}

class ATPassportClientImpl implements ATPassportClient {
  private readonly atpassport = new AtPassport({
    callbackUrl: `${env.PUBLIC_URL}/login/atpassport/callback`,
  });

  generateAuthUrl() {
    return this.atpassport.generateAuthUrl();
  }

  parseCallback(url: string, atpstate: string) {
    return this.atpassport.parseCallback(url, atpstate);
  }
}

export const atpassportClient: ATPassportClient = new ATPassportClientImpl();
