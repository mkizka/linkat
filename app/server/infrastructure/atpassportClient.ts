import { AtPassport } from "@atpassport/client/core";

import { env } from "~/utils/env";

export class ATPassportClient {
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

export const atpassportClient = new ATPassportClient();
