import { resolveTxt } from "node:dns/promises";

import { type AtprotoDid, isAtprotoDid } from "@atproto/did";
import { safeFetchWrap } from "@atproto-labs/fetch-node";

export class HandleResolverUnavailableError extends Error {
  name = "HandleResolverUnavailableError";
}

const NOT_FOUND_DNS_CODES = ["ENOTFOUND", "ENODATA"];

const isNotFoundDnsError = (error: unknown) =>
  error instanceof Error &&
  "code" in error &&
  typeof error.code === "string" &&
  NOT_FOUND_DNS_CODES.includes(error.code);

const isTimeout = (error: unknown) =>
  error instanceof Error &&
  (error.name === "AbortError" || error.name === "TimeoutError");

const parseDid = (value: string | undefined) =>
  value && isAtprotoDid(value) ? value : null;

const resolveDns = async (handle: string) => {
  const records = await resolveTxt(`_atproto.${handle}`).catch(
    (error: unknown) => {
      if (isNotFoundDnsError(error)) {
        return [];
      }
      throw new HandleResolverUnavailableError(
        `DNSで${handle}を解決できませんでした`,
        { cause: error },
      );
    },
  );
  const dids = records
    .map((chunks) => chunks.join(""))
    .filter((record) => record.startsWith("did="));
  return dids.length === 1 ? parseDid(dids[0]?.slice("did=".length)) : null;
};

export const createHandleResolver = () => {
  const fetch = safeFetchWrap({
    timeout: 3000,
    responseMaxSize: 10 * 1024,
  });

  const resolveWellKnown = async (handle: string, signal: AbortSignal) => {
    const url = new URL("/.well-known/atproto-did", `https://${handle}`);
    const response = await fetch(url, { redirect: "error", signal }).catch(
      (error: unknown) => {
        if (isTimeout(error) && !signal.aborted) {
          throw new HandleResolverUnavailableError(
            `${url}がタイムアウトしました`,
            { cause: error },
          );
        }
        return null;
      },
    );
    if (!response) {
      return null;
    }
    if (response.status >= 500) {
      throw new HandleResolverUnavailableError(
        `${url}がHTTP ${response.status}を返しました`,
      );
    }
    if (!response.ok) {
      return null;
    }
    const text = await response.text().catch(() => "");
    return parseDid(text.split("\n")[0]?.trim());
  };

  return {
    async resolve(handle: string): Promise<AtprotoDid | null> {
      const controller = new AbortController();
      const wellKnown = resolveWellKnown(handle, controller.signal);
      wellKnown.catch(() => {});
      try {
        const [dns] = await Promise.allSettled([resolveDns(handle)]);
        if (dns.status === "fulfilled" && dns.value) {
          return dns.value;
        }
        const did = await wellKnown;
        if (did) {
          return did;
        }
        if (dns.status === "rejected") {
          throw dns.reason;
        }
        return null;
      } finally {
        controller.abort();
      }
    },
  };
};
