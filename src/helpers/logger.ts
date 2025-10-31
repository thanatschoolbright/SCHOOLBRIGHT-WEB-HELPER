// Logger helper ที่รองรับทั้ง Winston และ console fallback
import { format } from "util";

type LogMethod = (...args: any[]) => void;

// Interface สำหรับ logger ที่ใช้ทั้งแอป
export type Logger = {
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
  debug: LogMethod;
  child?: (meta: Record<string, any>) => Logger;
};

// Client-safe console fallback logger. This module must not import any Node-only
// modules (like 'fs'), so keep it lightweight and browser-friendly.
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

// Default export: client-friendly logger instance. Server code can import
// `src/helpers/logger.server.ts` for a Winston-backed implementation and keep
// Node-only modules out of the browser bundle.
export const logger: Logger = createConsoleFallback();

export const createLogger = (defaultMeta: Record<string, any>): Logger => {
  return logger.child ? logger.child(defaultMeta) : logger;
};
