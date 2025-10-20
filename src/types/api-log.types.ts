/**
 * TypeScript definitions สำหรับ API Logging System
 * ใช้สำหรับจัดการประเภทข้อมูลของ API Log ให้เป็น Type Safety
 */

/**
 * ข้อมูลสำหรับสร้าง API Log ใหม่
 */
export interface CreateApiLogRequest {
  /** เวลาที่เรียก API */
  requestTime: Date;
  /** เวลาที่ตอบกลับ (optional) */
  responseTime?: Date;
  /** เวลาประมวลผล (milliseconds) */
  durationMs?: number;
  /** HTTP Method เช่น GET, POST, PUT, DELETE */
  method?: string;
  /** HTTP Status Code เช่น 200, 400, 500 */
  statusCode?: number;
  /** URL เต็ม */
  url?: string;
  /** Endpoint ที่ตัดพารามิเตอร์ออก */
  endpoint?: string;
  /** ชื่อ service เช่น timesheet, user, auth */
  serviceName?: string;
  /** Header ที่รับเข้า */
  requestHeader?: Record<string, any>;
  /** Body ของคำร้อง */
  requestBody?: Record<string, any>;
  /** Response ที่ส่งออก */
  responseBody?: Record<string, any>;
  /** IP ของผู้เรียก */
  ipAddress?: string;
  /** User Agent ของ client */
  userAgent?: string;
  /** ระบบ / ผู้ใช้ / Token ID ที่เรียก */
  calledBy?: string;
  /** รหัส trace สำหรับ distributed tracing */
  traceId?: string;
  /** ข้อความ Error (ถ้ามี) */
  errorMessage?: string;
  /** สำเร็จหรือไม่ */
  isSuccess?: boolean;
  /** ใช้แยก log ที่ถูกย้ายไป archive */
  isArchived?: boolean;
}

/**
 * ข้อมูลสำหรับดึงรายการ API Logs
 */
export interface GetApiLogsRequest {
  /** หน้าที่ต้องการดึง (เริ่มจาก 1) */
  page?: number;
  /** จำนวนรายการต่อหน้า */
  limit?: number;
  /** กรองตาม service name */
  serviceName?: string;
  /** กรองตามสถานะความสำเร็จ */
  isSuccess?: boolean;
  /** กรองตาม HTTP method */
  method?: string;
  /** กรองตาม status code */
  statusCode?: number;
  /** กรองตาม endpoint */
  endpoint?: string;
  /** กรองตาม called_by */
  calledBy?: string;
  /** กรองตาม trace_id */
  traceId?: string;
  /** กรองตามช่วงเวลา - เริ่มต้น */
  dateFrom?: Date;
  /** กรองตามช่วงเวลา - สิ้นสุด */
  dateTo?: Date;
  /** กรองเฉพาะที่ archived หรือไม่ */
  isArchived?: boolean;
  /** เรียงลำดับตาม field */
  sortBy?: 'request_time' | 'response_time' | 'duration_ms' | 'status_code';
  /** ทิศทางการเรียง */
  sortOrder?: 'asc' | 'desc';
}

/**
 * ข้อมูลตอบกลับของ API Log
 */
export interface ApiLogResponse {
  /** รหัส Log (Primary Key) */
  id: bigint;
  /** เวลาที่เรียก API */
  requestTime: Date;
  /** เวลาที่ตอบกลับ */
  responseTime?: Date;
  /** เวลาประมวลผล (milliseconds) */
  durationMs?: number;
  /** HTTP Method */
  method?: string;
  /** HTTP Status Code */
  statusCode?: number;
  /** URL เต็ม */
  url?: string;
  /** Endpoint ที่ตัดพารามิเตอร์ออก */
  endpoint?: string;
  /** ชื่อ service */
  serviceName?: string;
  /** Header ที่รับเข้า */
  requestHeader?: Record<string, any>;
  /** Body ของคำร้อง */
  requestBody?: Record<string, any>;
  /** Response ที่ส่งออก */
  responseBody?: Record<string, any>;
  /** IP ของผู้เรียก */
  ipAddress?: string;
  /** User Agent ของ client */
  userAgent?: string;
  /** ระบบ / ผู้ใช้ / Token ID ที่เรียก */
  calledBy?: string;
  /** รหัส trace สำหรับ distributed tracing */
  traceId?: string;
  /** ข้อความ Error (ถ้ามี) */
  errorMessage?: string;
  /** สำเร็จหรือไม่ */
  isSuccess: boolean;
  /** วันที่สร้าง log */
  createdAt: Date;
  /** ใช้แยก log ที่ถูกย้ายไป archive */
  isArchived: boolean;
}

/**
 * Standard API Response สำหรับการตอบกลับ
 */
export interface ApiResponse<T = any> {
  /** ข้อมูลที่ตอบกลับ */
  data?: T;
  /** ข้อความสำหรับผู้ใช้ */
  message?: string;
  /** สถานะความสำเร็จ */
  success: boolean;
  /** HTTP Status Code */
  statusCode: number;
  /** เวลาที่ประมวลผล */
  timestamp: string;
}

/**
 * Error Response สำหรับการตอบกลับเมื่อเกิดข้อผิดพลาด
 */
export interface ApiErrorResponse {
  /** ข้อความแสดงข้อผิดพลาด */
  message: string;
  /** รายละเอียดข้อผิดพลาด */
  error?: string;
  /** HTTP Status Code */
  statusCode: number;
  /** เวลาที่เกิดข้อผิดพลาด */
  timestamp: string;
  /** สถานะความสำเร็จ (จะเป็น false เสมอ) */
  success: false;
}
