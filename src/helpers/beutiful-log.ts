/**
 * Beautiful logging utility for objects with proper formatting
 */
type LogType = "log" | "info" | "warn" | "error";

export interface BeautifulLog {
  (data: any, type?: LogType, space?: number): void;
  (title: string, data: any, type?: LogType, space?: number): void;

  log: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

function isLogType(value: any): value is LogType {
  return (
    value === "log" || value === "info" || value === "warn" || value === "error"
  );
}

function parseArguments(args: any[]): {
  title?: string;
  data: any;
  type: LogType;
  space: number;
} {
  let title: string | undefined;
  let data: any;
  let type: LogType = "log";
  let space: number = 2;

  if (typeof args[0] === "string" && args.length > 1) {
    title = args[0];
    data = args[1];
    if (isLogType(args[2])) {
      type = args[2];
    }
    if (typeof args[3] === "number") {
      space = args[3];
    }
  } else {
    data = args[0];
    if (isLogType(args[1])) {
      type = args[1];
    }
    if (typeof args[2] === "number") {
      space = args[2];
    }
  }

  return { title, data, type, space };
}

const logFunctions: Record<LogType, (...args: any[]) => void> = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

// ANSI color codes
const logColors: Record<LogType, string> = {
  log: "\x1b[36m", // cyan
  info: "\x1b[34m", // blue
  warn: "\x1b[33m", // yellow
  error: "\x1b[31m", // red
};
const titleColor = "\x1b[37m"; // white
const resetColor = "\x1b[0m";

const Logger: BeautifulLog = function (...args: any[]): void {
  const { title, data, type, space } = parseArguments(args);
  const logger = logFunctions[type] || console.log;
  const logColor = logColors[type] || "";

  try {
    if (title !== undefined) {
      logger(`${titleColor}${String(title)}${resetColor}`);
    }

    if (typeof data === "object" && data !== null) {
      logger(`${logColor}${JSON.stringify(data, null, space)}${resetColor}`);
    } else {
      logger(`${logColor}${String(data)}${resetColor}`);
    }

    logger(`${logColor}${"=".repeat(40)}${resetColor}`);
  } catch (error) {
    console.error("❌ Error in beautifulLog:", error);
    logger(`${logColor}${String(data)}${resetColor}`);
  }
} as BeautifulLog;

Logger.log = function (...args: any[]) {
  if (typeof args[0] === "string" && args.length > 1) {
    // (title, data, space?)
    return Logger(args[0], args[1], "log", args[2]);
  } else {
    // (data, space?)
    return Logger(args[0], "log", args[1]);
  }
};
Logger.info = function (...args: any[]) {
  if (typeof args[0] === "string" && args.length > 1) {
    return Logger(args[0], args[1], "info", args[2]);
  } else {
    return Logger(args[0], "info", args[1]);
  }
};
Logger.warn = function (...args: any[]) {
  if (typeof args[0] === "string" && args.length > 1) {
    return Logger(args[0], args[1], "warn", args[2]);
  } else {
    return Logger(args[0], "warn", args[1]);
  }
};
Logger.error = function (...args: any[]) {
  if (typeof args[0] === "string" && args.length > 1) {
    return Logger(args[0], args[1], "error", args[2]);
  } else {
    return Logger(args[0], "error", args[1]);
  }
};

export { Logger };
export default Logger;
