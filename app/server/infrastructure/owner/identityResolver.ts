import { type Did, extractPdsUrl } from "@atproto/did";
import { AtprotoHandleResolverNode } from "@atproto-labs/handle-resolver-node";
import {
  createIdentityResolver,
  HANDLE_INVALID,
} from "@atproto-labs/identity-resolver";

import type { ILogger } from "~/server/infrastructure/logger/logger";
import { env, isProduction } from "~/utils/env";

export interface IIdentityResolver {
  resolve: (
    did: Did,
    options?: { fresh?: boolean },
  ) => Promise<{ did: Did; handle: string | null; pds: string } | null>;
}

export const identityResolverFactory = ({
  logger,
}: {
  logger: ILogger;
}): IIdentityResolver => {
  const log = logger.child("identityResolver");
  const resolver = createIdentityResolver({
    plcDirectoryUrl: env.ATPROTO_PLC_URL,
    handleResolver:
      env.ATPROTO_HANDLE_RESOLVER_URL ?? new AtprotoHandleResolverNode(),
    allowHttp: !isProduction,
  });
  return {
    async resolve(did, options) {
      try {
        const { didDoc, handle } = await resolver.resolve(did, {
          noCache: options?.fresh,
        });
        return {
          did,
          handle: handle === HANDLE_INVALID ? null : handle,
          pds: extractPdsUrl(didDoc).origin,
        };
      } catch (error) {
        log.warn("DIDまたはhandleの解決に失敗しました", { error });
        return null;
      }
    },
  };
};
