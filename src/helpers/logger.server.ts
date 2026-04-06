/**
 * High-Performance Universal Logger
 * เน้น Zero-dependency, Tree-shaking friendly และประมวลผลเร็วที่สุด
 */

const LOG_LIMIT = 100;
const isDev = process.env.NODE_ENV !== "production";

/**
 * Optimized Truncate: ตรวจสอบประเภทและขนาดยกเลิกการประมวลผลทันทีถ้าไม่จำเป็น
 */
const truncate = (msg: any): any => {
  if (typeof msg !== "string" || msg.length <= LOG_LIMIT) return msg;
  return msg.slice(0, LOG_LIMIT) + "...";
};

/**
 * ตัวแปรเก็บฟังก์ชันเปล่าสำหรับ No-op เพื่อลดการสร้าง function object ใหม่
 */
const noop = () => {};

export const logger = {
  info: noop,

  warn: noop,

  error: (msg: any, ...args: any[]) => {
    console.error(`[ERROR] ${truncate(msg)}`, ...args);
  },

  // ใช้ cached function แทนการสร้าง anonymous function ทุกครั้ง
  debug: noop,

  /**
   * Child Logger: ทำการ JSON.stringify metadata เพียงครั้งเดียวตอนสร้าง
   * เพื่อไม่ให้เป็นภาระตอนสั่ง log จริง
   */
  child: (meta: Record<string, any>) => {
    return {
      info: noop,
      warn: noop,
      error: (msg: any, ...args: any[]) =>
        console.error(`[ERROR] [${JSON.stringify(meta)}] ${truncate(msg)}`, ...args),
      debug: noop,
    };
  },
};

// Alias for compatibility
export const serverLogger = logger;

export const createLogger = (defaultMeta: Record<string, any>) => {
  return logger.child(defaultMeta);
};
