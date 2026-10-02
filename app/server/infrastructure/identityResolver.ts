import { type Did, DidError, extractPdsUrl } from "@atproto/did";
import {
  createIdentityResolver,
  IdentityResolverError,
} from "@atproto-labs/identity-resolver";

import { createHandleResolver } from "~/server/infrastructure/handleResolver";
import { env, isProduction } from "~/utils/env";
import { createLogger } from "~/utils/logger";

const logger = createLogger("identityResolver");

export type HandleResolution =
  | { status: "resolved"; did: Did }
  | { status: "notFound" }
  | { status: "unavailable" };

export interface IIdentityResolver {
  resolve: (
    handleOrDid: string,
  ) => Promise<{ did: Did; handle: string; pds: string } | null>;
  resolveHandle: (handle: string) => Promise<HandleResolution>;
}

const isNotFound = (error: unknown) =>
  error instanceof IdentityResolverError ||
  (error instanceof DidError && [404, 410].includes(error.status));

export const identityResolverFactory = (): IIdentityResolver => {
  const resolver = createIdentityResolver({
    plcDirectoryUrl: env.ATPROTO_PLC_URL,
    handleResolver: env.ATPROTO_HANDLE_RESOLVER_URL ?? createHandleResolver(),
    allowHttp: !isProduction,
  });
  return {
    async resolve(handleOrDid) {
      try {
        const { did, didDoc, handle } = await resolver.resolve(handleOrDid);
        return { did, handle, pds: extractPdsUrl(didDoc).origin };
      } catch (error) {
        logger.warn(error, "DIDまたはhandleの解決に失敗しました");
        return null;
      }
    },
    async resolveHandle(handle) {
      try {
        const { did } = await resolver.resolve(handle);
        return { status: "resolved", did };
      } catch (error) {
        if (isNotFound(error)) {
          return { status: "notFound" };
        }
        logger.warn(error, "handleの解決に一時的に失敗しました");
        return { status: "unavailable" };
      }
    },
  };
};
