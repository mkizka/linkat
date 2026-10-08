import { pino } from "pino";
import pinoHttp from "pino-http";

import { env } from "~/utils/env";

type LogFn = (message: string, obj?: object) => void;

export type Logger = Record<"debug" | "info" | "warn" | "error", LogFn>;

const rootLogger = pino({
  enabled: env.NODE_ENV !== "test",
  level: env.LOG_LEVEL,
  errorKey: "error",
});

export const createLogger = (name: string): Logger => {
  const logger = rootLogger.child({ name });
  return {
    debug: (message, obj) => logger.debug(obj, message),
    info: (message, obj) => logger.info(obj, message),
    warn: (message, obj) => logger.warn(obj, message),
    error: (message, obj) => logger.error(obj, message),
  };
};

export const httpLogger = pinoHttp({
  logger: rootLogger.child({ name: "http" }),
  customSuccessMessage: (req, res, responseTime) => {
    return `${req.method} ${res.statusCode} ${req.url} ${responseTime}ms`;
  },
  customErrorMessage: (req, res) => {
    return `${req.method} ${res.statusCode} ${req.url}`;
  },
  ...(env.NODE_ENV === "development" && {
    serializers: {
      req: () => undefined,
      res: () => undefined,
      responseTime: () => undefined,
    },
  }),
});
