import { errorResponse, successResponse } from "@/helpers/api/response";
import { sanitizeForwardHeaders } from "@/services/api-header";
import { NextRequest, NextResponse } from "next/server";
import { LeaveLetterService } from "../service/leave-letter.service";
import { ReadLeaveLetterSchema } from "../validation/leave-letter.validation";

/**
 * API สำหรับดึงข้อมูลจดหมายลาหยุดของผู้ใช้งาน (Read)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const headers = sanitizeForwardHeaders(request);

  // ✅ ตรวจสอบพารามิเตอร์ผ่าน Validation Schema
  const queryParams = {
    user_id: searchParams.get("user_id"),
    page: searchParams.get("page") || "1",
  };

  const validation = ReadLeaveLetterSchema.safeParse(queryParams);

  if (!validation.success) {
    return NextResponse.json(
      errorResponse({
        message_th: "ข้อมูลพารามิเตอร์ไม่ถูกต้อง",
        message_en: "Invalid query parameters",
        status: 400,
        error: validation.error.format(),
      }),
      { status: 400 },
    );
  }

  const { user_id, page } = validation.data;

  try {
    // 🚀 เรียกใช้ Service เพื่อดึงข้อมูล
    const result = await LeaveLetterService.getLeaveLetters(
      user_id,
      page,
      headers,
    );

    return NextResponse.json(
      successResponse({
        data: result.data,
        message_th: "ดึงข้อมูลจดหมายลาหยุดสำเร็จ",
        message_en: "Leave letters fetched successfully",
      }),
      { status: result.status },
    );
  } catch (error: any) {
    return NextResponse.json(
      errorResponse({
        message_th: "ไม่สามารถดึงข้อมูลจดหมายลาหยุดได้",
        message_en: error.message || "Failed to fetch leave letters",
        status: error.status || 500,
        error: error.data,
      }),
      { status: error.status || 500 },
    );
  }
}
