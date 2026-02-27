interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

interface ApiResponse<T = any> {
  status: number;
  message_th?: string | string[];
  message_en?: string | string[];
  data?: T;
  pagination?: PaginationMeta;
  error?: any;
}

interface SuccessOptions<T> {
  data: T;
  message_th?: string | string[];
  message_en?: string | string[];
  pagination?: PaginationMeta;
  status?: number;
}

/** Helper: แปลงข้อมูลเป็น string และจำกัดไม่เกิน 1000 ตัวอักษร */
function formatResponseData(value: any): string {
  try {
    const jsonString = JSON.stringify(value, null, 2);
    if (jsonString.length > 1000) {
      return jsonString.slice(0, 1000) + "...(Character is more than 1000)";
    }
    return jsonString;
  } catch {
    const str = String(value);
    return str.length > 1000
      ? str.slice(0, 1000) + "...(Character is more than 1000)"
      : str;
  }
}

/** ใช้สำหรับ Response สำเร็จ */
export function successResponse<T>({
  data,
  message_th = "สำเร็จ",
  message_en = "Success",
  pagination,
  status = 200,
}: SuccessOptions<T>): ApiResponse<T> {
  console.log("\x1b[32m%s\x1b[0m", "Response Data:", formatResponseData(data));

  return {
    status,
    message_th,
    message_en,
    data,
    pagination,
  };
}

interface ErrorOptions {
  message_th?: string | string[];
  message_en?: string | string[];
  status?: number;
  error?: any;
}

/** ใช้สำหรับ Response Error */
export function errorResponse({
  message_th = "เกิดข้อผิดพลาดภายในระบบ",
  message_en = "Internal Server Error",
  status = 500,
  error,
}: ErrorOptions): ApiResponse {
  console.log("\x1b[31m%s\x1b[0m", "Error Response:", error);
  return {
    status,
    message_th,
    message_en,
    error,
  };
}
