import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const isProduction =
  process.env.NODE_ENV === "production" && !process.env.E2E;

const match = <Prod, Default>({ prod, dev }: { prod: Prod; dev: Default }) => {
  return isProduction ? prod : dev;
};

const DEVELOPMENT_PRIVATE_KEY =
  "LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JR0hBZ0VBTUJNR0J5cUdTTTQ5QWdFR0NDcUdTTTQ5QXdFSEJHMHdhd0lCQVFRZ1hoS1ZMc2pwVSszSm9wd2kKcjhUcjBBVXVMNTNyRzR6V2duQkNSZUNRQjdTaFJBTkNBQVRaNzlHaGQxYnphVVpHb1lzcitLRVJxNnIyUXZJZApRQXZ4ZUpqRkdMbDJ0TDRmZUhSWmVkc3NxZjdDNUpjdGZWN2hKd2hYOG5ackxjYXU3OWtEQ25PTQotLS0tLUVORCBQUklWQVRFIEtFWS0tLS0tCg==";

const server = {
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default(process.env.NODE_ENV),
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error"])
    .default(match({ prod: "info", dev: "debug" })),
  DATABASE_URL: z.string(),
  // 開発環境でのOAuthログイン時にlocalhost:2583にリダイレクトされるが、
  // ドメインが同じだとOAuthログインに失敗するためlinkat.localhostを使う
  PUBLIC_URL: isProduction
    ? z.string()
    : z.string().default("http://linkat.localhost:3000"),
  // openssl rand -base64 33
  COOKIE_SECRET: isProduction
    ? z.string()
    : z.string().default("dev-cookie-secret"),
  // openssl ecparam -name prime256v1 -genkey | openssl pkcs8 -topk8 -nocrypt | openssl base64 -A
  PRIVATE_KEY_ES256_B64: isProduction
    ? z.string()
    : z.string().default(DEVELOPMENT_PRIVATE_KEY),
  BSKY_PUBLIC_API_URL: z
    .string()
    .url()
    .default(
      match({
        prod: "https://public.api.bsky.app",
        dev: "http://localhost:2584",
      }),
    ),
  BSKY_FIREHOSE_URL: z
    .string()
    .url()
    .default(
      match({
        prod: "wss://bsky.network",
        dev: "ws://localhost:2583",
      }),
    ),
  ATPROTO_PLC_URL: z
    .string()
    .url()
    .default(
      match({
        prod: "https://plc.directory",
        dev: "http://localhost:2582",
      }),
    ),
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
