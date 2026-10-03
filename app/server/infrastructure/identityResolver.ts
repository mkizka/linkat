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

export interface IIdentityResolver {
  resolve: (handleOrDid: string) => Promise<Identity | null>;
}

const extractHandle = (didDoc: AtprotoDidDocument) => {
  const aka = didDoc.alsoKnownAs?.find((value) => value.startsWith("at://"));
  const handle = aka?.slice("at://".length).toLowerCase();
  return handle && handle !== INVALID_HANDLE && isValidHandle(handle)
    ? handle
    : null;
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
    throw new Error(`${handle}の解決で通信に失敗しました`);
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

  const resolveDid = async (handleOrDid: string) =>
    isAtprotoDid(handleOrDid)
      ? handleOrDid
      : await handleResolver.resolve(handleOrDid.toLowerCase());

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
    async resolve(handleOrDid) {
      try {
        const did = await resolveDid(handleOrDid);
        if (!did) {
          return null;
        }
        const didDoc = await didResolver.resolve(did);
        const pds = extractPdsUrl(didDoc).origin;
        return { did, pds, handle: await verifyHandle(did, didDoc) };
      } catch (error) {
        logger.warn(error, "DIDまたはhandleの解決に失敗しました");
        return null;
      }
    },
  };
};
