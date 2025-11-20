import { NextResponse } from "next/server";
import { errorResponse } from "@helpers/api/response";
import { logger } from "@helpers/logger";

export function handleError(err: unknown, contextMessage = "API error") {
  logger.error(contextMessage, err);

  const error = err as any;
  const status = error?.status || 500;
  const message = error?.message || "Internal Server Error";

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


