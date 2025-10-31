import { NextResponse } from "next/server";
import { errorResponse } from "@helpers/api/response";
import { logger } from "@helpers/logger";

/**
 * Centralized error handler for API routes.
 *
 * Usage: return handleError(err, "POST /api/v1/timesheet/overtime/read error");
 */
export function handleError(err: unknown, contextMessage = "API error") {
  // Log the error with context
  logger.error(contextMessage, err);

  const error = err as any;
  const status = error?.status || 500;
  const message = error?.message || "Internal Server Error";

  // Provide a Thai message alongside English. Use sensible defaults per status.
  let message_th = error?.message_th;
  if (!message_th) {
    if (status >= 500) message_th = "เกิดข้อผิดพลาดภายในระบบ";
    else if (status === 404) message_th = "ไม่พบรายการที่ร้องขอ";
    else if (status === 400) message_th = "คำขอไม่ถูกต้อง";
    else message_th = message;
  }

  return NextResponse.json(
    errorResponse({
      message_en: message,
      message_th,
      status,
      error: error?.validationErrors || error,
    }),
    { status }
  );
}

export default handleError;

/**
 * Build pagination metadata used by list endpoints.
 * Keeps the same shape returned throughout the API: { page, page_size, total, total_pages }
 */
export function buildPagination(skip: number, limit: number, total: number) {
  const page = Math.floor(skip / limit) + 1;

  return {
    page,
    page_size: limit,
    total,
    total_pages: Math.ceil(total / limit),
  };
}
