import {
  type AtprotoDidDocument,
  type Did,
  extractPdsUrl,
  isAtprotoDid,
} from "@atproto/did";
import { INVALID_HANDLE, isValidHandle } from "@atproto/syntax";
import { DidResolverCommon } from "@atproto-labs/did-resolver";
import {
  type HandleResolver,
  XrpcHandleResolver,
} from "@atproto-labs/handle-resolver";
import { AtprotoHandleResolverNode } from "@atproto-labs/handle-resolver-node";

import { env, isProduction } from "~/utils/env";
import { createLogger } from "~/utils/logger";

const logger = createLogger("identityResolver");

export type Identity = {
  did: Did;
  pds: string;
  handle: string | null | undefined;
};

export type IdentityResolution =
  | { type: "found"; identity: Identity }
  | { type: "notFound" }
  | { type: "unavailable" };

export interface IIdentityResolver {
  resolve: (did: Did) => Promise<IdentityResolution>;
}

class HandleUnavailableError extends Error {}

const extractHandle = (didDoc: AtprotoDidDocument) => {
  const aka = didDoc.alsoKnownAs?.find((value) => value.startsWith("at://"));
  const handle = aka?.slice("at://".length).toLowerCase();
  return handle && handle !== INVALID_HANDLE && isValidHandle(handle)
    ? handle
    : null;
};

const isNotFoundError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }
  if ("response" in error && error.response instanceof Response) {
    return error.response.status >= 400 && error.response.status < 500;
  }
  return isNotFoundError(error.cause);
};

const resolveHandleWithNode = async (handle: string) => {
  const failure = { unavailable: false };
  const resolver = new AtprotoHandleResolverNode({
    fetch: async (input, init) => {
      try {
        const response = await fetch(input, init);
        if (response.status >= 500) {
          failure.unavailable = true;
        }
        return response;
      } catch (error) {
        failure.unavailable = true;
        throw error;
      }
    },
  });
  const did = await resolver.resolve(handle);
  if (!did && failure.unavailable) {
    throw new HandleUnavailableError(`${handle}の解決で通信に失敗しました`);
  }
  return did;
};

export const identityResolverFactory = (): IIdentityResolver => {
  const didResolver = new DidResolverCommon({
    plcDirectoryUrl: env.ATPROTO_PLC_URL,
    allowHttp: !isProduction,
  });
  const handleResolver: Pick<HandleResolver, "resolve"> =
    env.ATPROTO_HANDLE_RESOLVER_URL
      ? new XrpcHandleResolver(env.ATPROTO_HANDLE_RESOLVER_URL)
      : { resolve: resolveHandleWithNode };

  const verifyHandle = async (did: Did, didDoc: AtprotoDidDocument) => {
    const handle = extractHandle(didDoc);
    if (!handle) {
      return null;
    }
    try {
      const resolvedDid = await handleResolver.resolve(handle);
      return resolvedDid === did ? handle : null;
    } catch (error) {
      logger.warn(error, "handleの検証に失敗しました");
      return undefined;
    }
  };

  return {
    async resolve(did) {
      if (!isAtprotoDid(did)) {
        return { type: "notFound" };
      }
      let didDoc: AtprotoDidDocument;
      try {
        didDoc = await didResolver.resolve(did);
      } catch (error) {
        logger.warn(error, "DIDの解決に失敗しました");
        return isNotFoundError(error)
          ? { type: "notFound" }
          : { type: "unavailable" };
      }
      let pds: string;
      try {
        pds = extractPdsUrl(didDoc).origin;
      } catch (error) {
        logger.warn(error, "DIDドキュメントにPDSがありません");
        return { type: "notFound" };
      }
      return {
        type: "found",
        identity: { did, pds, handle: await verifyHandle(did, didDoc) },
      };
    },
  };
};
