import { asDid, type Did, isDid } from "@atproto/did";
import { IdResolver } from "@atproto/identity";
import type { HandleString } from "@atproto/syntax";

import resolveHandleLexicon from "~/generated/com/atproto/identity/resolveHandle";
import { LinkatAgent } from "~/libs/agent";
import { env, isProduction } from "~/utils/env";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("identityService");

export interface IIdentityService {
  resolveHandle: (handle: HandleString) => Promise<Did | null>;
}

export const identityServiceFactory = (): IIdentityService => {
  const resolver = new IdResolver({
    // 既定のfetchはSSRF対策でexample.comやlocalhostなどを拒否するため、本番以外では標準のfetchを使う
    fetch: isProduction ? undefined : (...args) => globalThis.fetch(...args),
  });

  const handleResolverUrl = env.ATPROTO_HANDLE_RESOLVER_URL;
  const resolveHandleRaw = handleResolverUrl
    ? async (handle: HandleString) => {
        const agent = LinkatAgent.credential(handleResolverUrl);
        const response = await agent.call(resolveHandleLexicon, { handle });
        return response.did;
      }
    : (handle: HandleString) => resolver.handle.resolve(handle);

  return {
    async resolveHandle(handle) {
      const did = await tryCatch(resolveHandleRaw)(handle);
      if (did instanceof Error || !did || !isDid(did)) {
        logger.warn({ handle }, "handleの解決に失敗しました");
        return null;
      }
      return asDid(did);
    },
  };
};
