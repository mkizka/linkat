import { asDid, type Did, isDid } from "@atproto/did";
import type { DidDocument } from "@atproto/identity";
import { IdResolver } from "@atproto/identity";
import { type HandleString, isValidHandle } from "@atproto/syntax";

import resolveHandleLexicon from "~/generated/com/atproto/identity/resolveHandle";
import { LinkatAgent } from "~/libs/agent";
import { env, isProduction } from "~/utils/env";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("identityResolver");

const INVALID_HANDLE = "handle.invalid";

const getHandle = (document: DidDocument) => {
  const handleUri = document.alsoKnownAs?.find((uri) =>
    uri.startsWith("at://"),
  );
  return handleUri?.slice("at://".length) ?? null;
};

export interface IIdentityResolver {
  resolveHandleToDid: (handle: HandleString) => Promise<Did | null>;
  resolveDidToHandle: (did: Did) => Promise<string | null>;
}

export const identityResolverFactory = (): IIdentityResolver => {
  const resolver = new IdResolver({
    plcUrl: env.ATPROTO_PLC_URL,
    // 既定のfetchはSSRF対策でexample.comやlocalhostなどを拒否するため、本番以外では標準のfetchを使う
    fetch: isProduction ? undefined : (...args) => globalThis.fetch(...args),
  });

  const handleResolverUrl = env.ATPROTO_HANDLE_RESOLVER_URL;
  const fetchDidByHandle = handleResolverUrl
    ? async (handle: HandleString) => {
        const agent = LinkatAgent.credential(handleResolverUrl);
        const response = await agent.call(resolveHandleLexicon, { handle });
        return response.did;
      }
    : (handle: HandleString) => resolver.handle.resolve(handle);

  const resolveHandleToDid = async (handle: HandleString) => {
    const did = await tryCatch(fetchDidByHandle)(handle);
    if (did instanceof Error || !did || !isDid(did)) {
      logger.warn({ handle }, "handleの解決に失敗しました");
      return null;
    }
    return asDid(did);
  };

  const resolveDidDocument = async (did: Did) => {
    const document = await tryCatch((did: Did) => resolver.did.resolve(did))(
      did,
    );
    if (document instanceof Error || !document) {
      logger.warn({ did }, "DIDの解決に失敗しました");
      return null;
    }
    return document;
  };

  return {
    resolveHandleToDid,
    async resolveDidToHandle(did) {
      const document = await resolveDidDocument(did);
      if (!document) {
        return null;
      }
      const handle = getHandle(document);
      if (
        !isValidHandle(handle) ||
        (await resolveHandleToDid(handle)) !== did
      ) {
        logger.warn({ did, handle }, "handleを検証できませんでした");
        return INVALID_HANDLE;
      }
      return handle;
    },
  };
};
