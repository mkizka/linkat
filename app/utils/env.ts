import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const server = {
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default(process.env.NODE_ENV),
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error"])
    .default(process.env.NODE_ENV === "production" ? "info" : "debug"),
  DATABASE_URL: z.string(),
  BSKY_FIREHOSE_URL: z.string().url(),
};

const client = {
  VITE_BSKY_PUBLIC_API_URL: z.string().url(),
};

export const env = (() => {
  try {
    return createEnv({
      server,
      client,
      clientPrefix: "VITE_",
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
