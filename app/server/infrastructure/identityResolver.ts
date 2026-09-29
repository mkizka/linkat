import type { Did } from "@atproto/did";
import { AtprotoHandleResolverNode } from "@atproto-labs/handle-resolver-node";
import { createIdentityResolver } from "@atproto-labs/identity-resolver";

import { env, isProduction } from "~/utils/env";
import { createLogger } from "~/utils/logger";

const logger = createLogger("identityResolver");

export interface IIdentityResolver {
  resolve: (
    handleOrDid: string,
  ) => Promise<{ did: Did; handle: string } | null>;
}

export const identityResolverFactory = (): IIdentityResolver => {
  const resolver = createIdentityResolver({
    plcDirectoryUrl: env.ATPROTO_PLC_URL,
    handleResolver:
      env.ATPROTO_HANDLE_RESOLVER_URL ?? new AtprotoHandleResolverNode(),
    allowHttp: !isProduction,
  });
  return {
    async resolve(handleOrDid) {
      try {
        const { did, handle } = await resolver.resolve(handleOrDid);
        return { did, handle };
      } catch (error) {
        logger.warn(error, "DIDまたはhandleの解決に失敗しました");
        return null;
      }
    },
  };
};
