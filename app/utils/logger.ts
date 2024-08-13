/* eslint-disable no-console */

// https://docs.railway.app/guides/logs#structured-logs
type StructuredLog = {
  message: string;
  level: "debug" | "info" | "warn" | "error";
  [key: string]: string | number | boolean | object | null;
};

// const logLevelsOrder = {
//   debug: 0,
//   info: 1,
//   warn: 2,
//   error: 3,
// } satisfies Record<LogLevel, number>;

// const isLower = (a: LogLevel, b: LogLevel) => {
//   return logLevelsOrder[a] < logLevelsOrder[b];
// };

// const isSameOrHigher = (a: LogLevel, b: LogLevel) => {
//   return !isLower(a, b);
// };

const writeLog = (log: StructuredLog & { name: string }) => {
  if (process.env.NODE_ENV === "test") {
    return;
  }
  if (typeof window !== "undefined") {
    const { message, level, name, ...data } = log;
    const text = `[${name}] ${message}`;
    if (Object.keys(data).length > 0) {
      console[level](text, data);
    } else {
      console[level](text);
    }
  } else {
    console[log.level](JSON.stringify(log));
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
