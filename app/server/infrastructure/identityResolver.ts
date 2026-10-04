import { type Did, extractPdsUrl } from "@atproto/did";
import { AtprotoHandleResolverNode } from "@atproto-labs/handle-resolver-node";
import {
  createIdentityResolver,
  HANDLE_INVALID,
} from "@atproto-labs/identity-resolver";

import { env, isProduction } from "~/utils/env";
import { createLogger } from "~/utils/logger";

const logger = createLogger("identityResolver");

export interface IIdentityResolver {
  resolve: (
    did: Did,
    options?: { noCache?: boolean },
  ) => Promise<{ did: Did; handle: string | null; pds: string } | null>;
}

export const identityResolverFactory = (): IIdentityResolver => {
  const resolver = createIdentityResolver({
    plcDirectoryUrl: env.ATPROTO_PLC_URL,
    handleResolver:
      env.ATPROTO_HANDLE_RESOLVER_URL ?? new AtprotoHandleResolverNode(),
    allowHttp: !isProduction,
  });
  return {
    async resolve(did, options) {
      try {
        const { didDoc, handle } = await resolver.resolve(did, options);
        return {
          did,
          handle: handle === HANDLE_INVALID ? null : handle,
          pds: extractPdsUrl(didDoc).origin,
        };
      } catch (error) {
        logger.warn(error, "DIDまたはhandleの解決に失敗しました");
        return null;
      }
    },
  };
};
