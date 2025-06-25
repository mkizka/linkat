import { pino } from "pino";

import { env } from "./env";

const isTest = env.NODE_ENV === "test";

const logger = pino({
  enabled: !isTest,
  level: env.LOG_LEVEL,
});

export const createLogger = (name: string) => {
  return logger.child({ name });
};
