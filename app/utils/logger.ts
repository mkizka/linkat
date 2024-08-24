/* eslint-disable no-console */
import { env } from "./env";

type LogLevel = typeof env.LOG_LEVEL;

// https://docs.railway.app/guides/logs#structured-logs
type StructuredLog = {
  message: string;
  level: LogLevel;
  name: string;
  [key: string]: string | number | boolean | object | null;
};

const logLevelsOrder = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} satisfies Record<LogLevel, number>;

const isLower = (a: LogLevel, b: LogLevel) => {
  return logLevelsOrder[a] < logLevelsOrder[b];
};

const writeLogBrowser = (log: StructuredLog) => {
  if (process.env.NODE_ENV === "production") {
    return;
  }
  const { message, level, name, ...data } = log;
  const text = `[${name}] ${message}`;
  if (Object.keys(data).length > 0) {
    console[level](text, data);
  } else {
    console[level](text);
  }
};

const writeLogServer = (log: StructuredLog) => {
  // クライアント側でこのファイルをimportするとエラーになってしまうため、動的にimportする
  if (process.env.NODE_ENV === "test" || isLower(log.level, env.LOG_LEVEL)) {
    return;
  }
  console[log.level](JSON.stringify(log));
};

const writeLog = (log: StructuredLog) => {
  if (process.env.NODE_ENV === "test") {
    return;
  }
  if (typeof window !== "undefined") {
    writeLogBrowser(log);
  } else {
    writeLogServer(log);
  }
};

export const createLogger = (
  name: string,
): {
  [level in StructuredLog["level"]]: (
    message: string,
    data?: object | null,
  ) => void;
} => {
  return {
    debug(message, data) {
      writeLog({ level: "debug", message, name, ...data });
    },
    info(message, data) {
      writeLog({ level: "info", message, name, ...data });
    },
    warn(message, data) {
      writeLog({ level: "warn", message, name, ...data });
    },
    error(message, data) {
      writeLog({ level: "error", message, name, ...data });
    },
  };
};
