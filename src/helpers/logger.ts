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

// ฟังก์ชันสร้าง Winston logger พร้อมการตกแต่งที่สวยงาม
function createWinstonLogger(): Logger | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const winston = require("winston");

    // กำหนดสีสันสำหรับแต่ละ log level
    const customColors = {
      error: "bold red",
      warn: "bold yellow",
      info: "bold cyan",
      debug: "bold magenta",
    };

    // เพิ่มสีที่กำหนดเองเข้าไปใน Winston
    winston.addColors(customColors);

    // Format สำหรับแสดงผลในคอนโซล (มี syntax highlighting)
    const consoleFormat = winston.format.combine(
      // เพิ่ม timestamp แบบ ISO
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      // เพิ่มสีตาม log level
      winston.format.colorize({ all: false, level: true }),
      // จัด format ข้อความให้อ่านง่าย
      winston.format.printf(
        ({ level, message, timestamp: ts, ...meta }: any) => {
          // กรอง metadata ที่ไม่ต้องการ (เช่น level, message, timestamp)
          const filteredMeta = Object.keys(meta)
            .filter(
              (key) => !["level", "message", "timestamp", "splat"].includes(key)
            )
            .reduce((obj, key) => ({ ...obj, [key]: meta[key] }), {});

          // สร้างส่วนแสดง metadata ถ้ามี
          const metaStr =
            Object.keys(filteredMeta).length > 0
              ? `\n  ${JSON.stringify(filteredMeta, null, 2)
                  .split("\n")
                  .join("\n  ")}`
              : "";

          // Return format: [timestamp] LEVEL: message {metadata}
          return `[${ts}] ${level}: ${message}${metaStr}`;
        }
      )
    );

    // Format สำหรับเขียนไฟล์ (ไม่มีสี)
    const fileFormat = winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.json() // บันทึกเป็น JSON เพื่อให้ parse ง่าย
    );

    // สร้าง transports (ช่องทางการ output)
    const transports: any[] = [
      // Console transport - แสดงใน terminal
      new winston.transports.Console({
        format: consoleFormat,
        stderrLevels: ["error"], // ส่ง error ไป stderr แทน stdout
      }),
    ];

    // เพิ่ม file transport ถ้าอยู่ใน production
    if (process.env.NODE_ENV === "production") {
      transports.push(
        // ไฟล์สำหรับ error logs
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
          format: fileFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 5, // เก็บไฟล์ย้อนหลัง 5 ไฟล์
        }),
        // ไฟล์สำหรับ logs ทั้งหมด
        new winston.transports.File({
          filename: "logs/combined.log",
          format: fileFormat,
          maxsize: 5242880,
          maxFiles: 5,
        })
      );
    }

    // สร้าง Winston logger instance
    const winstonLogger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info", // อ่านจาก environment variable
      transports,
      exitOnError: false, // ไม่ให้ exit process เมื่อเกิด error
    });

    // Wrapper functions เพื่อรองรับ util.format style (เหมือน console.log)
    const createLogMethod = (level: string): LogMethod => {
      return (...args: any[]) => {
        // ใช้ util.format เพื่อจัดการ format string แบบ printf-style
        const message = format(...args);
        winstonLogger.log(level, message);
      };
    };

    // สร้าง child logger พร้อม metadata เริ่มต้น
    const createChild = (meta: Record<string, any>): Logger => {
      // สร้าง child logger ที่มี metadata ติดไปทุก log
      const childLogger = winstonLogger.child(meta);

      return {
        info: (...args: any[]) => childLogger.info(format(...args)),
        warn: (...args: any[]) => childLogger.warn(format(...args)),
        error: (...args: any[]) => childLogger.error(format(...args)),
        debug: (...args: any[]) => childLogger.debug(format(...args)),
        child: (childMeta: Record<string, any>) =>
          createChild({ ...meta, ...childMeta }), // รวม metadata แบบซ้อน
      };
    };

    // Return logger object ที่ implement Logger interface
    return {
      info: createLogMethod("info"),
      warn: createLogMethod("warn"),
      error: createLogMethod("error"),
      debug: createLogMethod("debug"),
      child: createChild,
    };
  } catch (error) {
    // ถ้า winston ไม่พร้อมใช้งาน return null
    console.warn("Winston is not available, falling back to console logging");
    return null;
  }
}

// สร้าง console fallback logger (เผื่อ winston ใช้ไม่ได้)
function createConsoleFallback(): Logger {
  // Wrapper เพื่อใช้ util.format กับ console methods
  const wrap = (fn: (...args: any[]) => void): LogMethod => {
    return (...args: any[]) => fn(format(...args));
  };

  // สร้าง child logger แบบ console
  const createChild = (meta: Record<string, any>): Logger => ({
    info: (...args: any[]) => console.log("[INFO]", format(...args), meta), // แสดง meta ต่อท้าย
    warn: (...args: any[]) => console.warn("[WARN]", format(...args), meta),
    error: (...args: any[]) => console.error("[ERROR]", format(...args), meta),
    debug: (...args: any[]) =>
      (console.debug || console.log)("[DEBUG]", format(...args), meta),
    child: (childMeta: Record<string, any>) =>
      createChild({ ...meta, ...childMeta }),
  });

  return {
    info: wrap((msg) => console.log(`[INFO] ${msg}`)),
    warn: wrap((msg) => console.warn(`[WARN] ${msg}`)),
    error: wrap((msg) => console.error(`[ERROR] ${msg}`)),
    debug: wrap((msg) => (console.debug || console.log)(`[DEBUG] ${msg}`)),
    child: createChild,
  };
}

// Export logger instance (พยายามใช้ Winston ก่อน ถ้าไม่ได้ใช้ console)
export const logger: Logger = createWinstonLogger() || createConsoleFallback();

// Export helper สำหรับสร้าง logger พร้อม metadata เริ่มต้น
export const createLogger = (defaultMeta: Record<string, any>): Logger => {
  return logger.child ? logger.child(defaultMeta) : logger;
};
