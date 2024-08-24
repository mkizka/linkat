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
  BSKY_PUBLIC_API_URL: z.string().url(),
  BSKY_FIREHOSE_URL: z.string().url(),
};

export const env = createEnv({
  server,
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
  skipValidation: true,
});

// ↑でバリデーションを行うとこのファイルがブラウザでも使用するファイルにimportされたときに
// エラーになってしまうため、以下でサーバー側でのみバリデーションを行う
if (typeof window === "undefined") {
  createEnv({
    server,
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
  });
}
