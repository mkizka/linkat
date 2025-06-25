import { pino } from "pino";

import { env } from "./env";

const isTest = process.env.NODE_ENV === "test";

const isServer = typeof window === "undefined";

const logger = pino({
  enabled: !isTest,
  level: isServer ? env.LOG_LEVEL : "debug",
});

export const createLogger = (name: string) => {
  return logger.child({ name });
};
