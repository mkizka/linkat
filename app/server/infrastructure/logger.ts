import { pino } from "pino";
import pinoHttp from "pino-http";

import { env } from "~/utils/env";

export interface IChildLogger {
  debug: (message: string, obj?: object) => void;
  info: (message: string, obj?: object) => void;
  warn: (message: string, obj?: object) => void;
  error: (message: string, obj?: object) => void;
}

export interface ILogger {
  child: (name: string) => IChildLogger;
}

const rootLogger = pino({
  enabled: env.NODE_ENV !== "test",
  level: env.LOG_LEVEL,
  errorKey: "error",
});

export const loggerFactory = (): ILogger => ({
  child: (name) => {
    const logger = rootLogger.child({ name });
    return {
      debug: (message, obj) => logger.debug(obj, message),
      info: (message, obj) => logger.info(obj, message),
      warn: (message, obj) => logger.warn(obj, message),
      error: (message, obj) => logger.error(obj, message),
    };
  },
});

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
