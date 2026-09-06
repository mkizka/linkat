import type { DidDocument } from "@atproto/identity";
import { getHandle, IdResolver } from "@atproto/identity";

import { env } from "~/utils/env";
import { createLogger } from "~/utils/logger";

const logger = createLogger("didService");

const resolver = new IdResolver({
  plcUrl: env.ATPROTO_PLC_URL,
});

// 参考: https://github.com/bluesky-social/atproto/blob/319aa7cf6dd7de0262a40d69f695c9a0eb0b5179/packages/common-web/src/did-doc.ts#L82-L104
const getServiceEndpoint = (document: DidDocument) => {
  const serviceUrl = document.service?.find(
    (item) => item.id === "#atproto_pds",
  )?.serviceEndpoint;
  if (typeof serviceUrl !== "string") {
    return null;
  }
  return serviceUrl;
};

export const resolveServiceUrl = async (userDid: string) => {
  const didDocument = await resolver.did.resolve(userDid);
  if (!didDocument) {
    logger.warn({ userDid }, "DIDの解決に失敗しました");
    return null;
  }
  const serviceUrl = getServiceEndpoint(didDocument);
  if (!serviceUrl) {
    logger.warn({ didDocument }, "DID解決後にPDSのURLが取得できませんでした");
    return null;
  }
  return serviceUrl;
};

export const resolveHandle = async (userDid: string) => {
  const didDocument = await resolver.did.resolve(userDid);
  if (!didDocument) {
    logger.warn({ userDid }, "DIDの解決に失敗しました");
    return null;
  }
  const handle = getHandle(didDocument);
  if (!handle) {
    logger.warn({ didDocument }, "DID解決後にhandleが取得できませんでした");
    return null;
  }
  return handle;
};
