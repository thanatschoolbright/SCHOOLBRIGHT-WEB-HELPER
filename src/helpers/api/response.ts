interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ApiResponse<T = any> {
  status: number;
  message_th?: string;
  message_en?: string;
  data?: T;
  pagination?: PaginationMeta;
  error?: any;
}

interface SuccessOptions<T> {
  data: T;
  message_th?: string;
  message_en?: string;
  pagination?: PaginationMeta;
  status?: number;
}

export function successResponse<T>({
  data,
  message_th = "สำเร็จ",
  message_en = "Success",
  pagination,
  status = 200,
}: SuccessOptions<T>): ApiResponse<T> {
  console.log(
    "\x1b[32m%s\x1b[0m",
    "✅ Response Data:",
    JSON.stringify(data, null, 2)
  );
  return {
    status,
    message_th,
    message_en,
    data,
    pagination,
  };
}

interface ErrorOptions {
  message_th?: string;
  message_en?: string;
  status?: number;
  error?: any;
}

export function errorResponse({
  message_th = "เกิดข้อผิดพลาดภายในระบบ",
  message_en = "Internal Server Error",
  status = 500,
  error,
}: ErrorOptions): ApiResponse {
  console.log("\x1b[31m%s\x1b[0m", "❌ Error Response:", error);
  return {
    status,
    message_th,
    message_en,
    error,
  };
}
