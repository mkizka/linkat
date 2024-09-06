import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const prod = process.env.NODE_ENV === "production";

const server = {
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default(process.env.NODE_ENV),
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error"])
    .default(prod ? "info" : "debug"),
  DATABASE_URL: z.string(),
  BSKY_PUBLIC_API_URL: z
    .string()
    .url()
    .default(prod ? "https://public.api.bsky.app" : "http://localhost:2584"),
  BSKY_FIREHOSE_URL: z
    .string()
    .url()
    .default(prod ? "wss://bsky.network" : "ws://localhost:2583"),
  ATPROTO_PCL_URL: z
    .string()
    .url()
    .default(prod ? "https://plc.directory" : "http://localhost:2582"),
};

export const env = (() => {
  try {
    return createEnv({
      server,
      runtimeEnv: process.env,
      emptyStringAsUndefined: true,
    });
  } catch (e) {
    // logger.tsなどを通してブラウザでも使用するファイルにimportされた時は
    // バリデーションが通らないので、ブラウザ環境では無視する
    if (typeof window !== "undefined") {
      return import.meta.env as never;
    }
    throw e;
  }
})();
