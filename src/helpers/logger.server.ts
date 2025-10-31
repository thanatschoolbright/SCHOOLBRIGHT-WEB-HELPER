// Server-only logger using Winston. Import this file only from server code.
import { format } from "util";

type LogMethod = (...args: any[]) => void;

export type Logger = {
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
  debug: LogMethod;
  child?: (meta: Record<string, any>) => Logger;
};

// Create a lightweight console fallback for server use if Winston is not available
function createConsoleFallback(): Logger {
  const wrap = (fn: (...args: any[]) => void): LogMethod => {
    return (...args: any[]) => fn(format(...args));
  };

  const createChild = (meta: Record<string, any>): Logger => ({
    info: (...args: any[]) => console.log("[INFO]", format(...args), meta),
    warn: (...args: any[]) => console.warn("[WARN]", format(...args), meta),
    error: (...args: any[]) => console.error("[ERROR]", format(...args), meta),
    debug: (...args: any[]) => (console.debug || console.log)("[DEBUG]", format(...args), meta),
    child: (childMeta: Record<string, any>) => createChild({ ...meta, ...childMeta }),
  });

  return {
    info: wrap((msg) => console.log(`[INFO] ${msg}`)),
    warn: wrap((msg) => console.warn(`[WARN] ${msg}`)),
    error: wrap((msg) => console.error(`[ERROR] ${msg}`)),
    debug: wrap((msg) => (console.debug || console.log)(`[DEBUG] ${msg}`)),
    child: createChild,
  };
}

// Winston-based implementation. This function will only be executed on the server
// because this file should never be imported from client-side code.
export function createWinstonLogger(): Logger | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const winston = require("winston");

    const customColors = {
      error: "bold red",
      warn: "bold yellow",
      info: "bold cyan",
      debug: "bold magenta",
    };

    winston.addColors(customColors);

    const consoleFormat = winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.colorize({ all: false, level: true }),
      winston.format.printf(({ level, message, timestamp: ts, ...meta }: any) => {
        const filteredMeta = Object.keys(meta)
          .filter((key) => !["level", "message", "timestamp", "splat"].includes(key))
          .reduce((obj, key) => ({ ...obj, [key]: meta[key] }), {});

        const metaStr = Object.keys(filteredMeta).length > 0
          ? `\n  ${JSON.stringify(filteredMeta, null, 2).split("\n").join("\n  ")}`
          : "";

        return `[${ts}] ${level}: ${message}${metaStr}`;
      })
    );

    const fileFormat = winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.json()
    );

    const transports: any[] = [
      new winston.transports.Console({
        format: consoleFormat,
        stderrLevels: ["error"],
      }),
    ];

    if (process.env.NODE_ENV === "production") {
      transports.push(
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
          format: fileFormat,
          maxsize: 5242880,
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: "logs/combined.log",
          format: fileFormat,
          maxsize: 5242880,
          maxFiles: 5,
        })
      );
    }

    const winstonLogger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      transports,
      exitOnError: false,
    });

    const createLogMethod = (level: string): LogMethod => {
      return (...args: any[]) => {
        const message = format(...args);
        winstonLogger.log(level, message);
      };
    };

    const createChild = (meta: Record<string, any>): Logger => {
      const childLogger = winstonLogger.child(meta);

      return {
        info: (...args: any[]) => childLogger.info(format(...args)),
        warn: (...args: any[]) => childLogger.warn(format(...args)),
        error: (...args: any[]) => childLogger.error(format(...args)),
        debug: (...args: any[]) => childLogger.debug(format(...args)),
        child: (childMeta: Record<string, any>) => createChild({ ...meta, ...childMeta }),
      };
    };

    return {
      info: createLogMethod("info"),
      warn: createLogMethod("warn"),
      error: createLogMethod("error"),
      debug: createLogMethod("debug"),
      child: createChild,
    };
  } catch (error) {
    // If winston isn't available, fallback to console implementation
    console.warn("Winston is not available on the server, falling back to console logging");
    return createConsoleFallback();
  }
}

// Export a server logger instance (server-only import)
export const serverLogger: Logger = createWinstonLogger() || createConsoleFallback();

export const createServerLogger = (defaultMeta: Record<string, any>): Logger => {
  return serverLogger.child ? serverLogger.child(defaultMeta) : serverLogger;
};
