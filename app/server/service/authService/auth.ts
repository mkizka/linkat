import type { Did } from "@atproto/did";

import type { IOAuthClient } from "~/server/infrastructure/oauthClient";
import type { IUserService } from "~/server/service/userService/user";

export interface IAuthService {
  authorize: (handle: string) => Promise<URL>;
  handleCallback: (url: string) => Promise<Did>;
  getClientMetadata: () => IOAuthClient["clientMetadata"];
  getJwks: () => IOAuthClient["jwks"];
}

export const authServiceFactory = ({
  oauthClient,
  userService,
}: {
  oauthClient: IOAuthClient;
  userService: IUserService;
}): IAuthService => ({
  authorize: (handle) => oauthClient.authorize(handle),
  async handleCallback(url) {
    const params = new URL(url).searchParams;
    const did = await oauthClient.callback(params);
    const user = await userService.syncUser(did);
    if (!user) {
      throw new Error("ログインしたユーザーの情報を取得できませんでした");
    }
    return did;
  },
  getClientMetadata: () => oauthClient.clientMetadata,
  getJwks: () => oauthClient.jwks,
});
