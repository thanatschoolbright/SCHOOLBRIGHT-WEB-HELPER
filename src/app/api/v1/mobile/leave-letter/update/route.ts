import { errorResponse, successResponse } from "@/helpers/api/response";
import { sanitizeForwardHeaders } from "@/services/api-header";
import { NextRequest, NextResponse } from "next/server";
import { LeaveLetterService } from "../service/leave-letter.service";
import { UpdateLeaveStatusSchema } from "../validation/leave-letter.validation";

/* ✨ API สำหรับอัปเดต/แก้ไขสถานะจดหมายลาหยุด (Update/Fix) */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const headers = sanitizeForwardHeaders(request);

  // 🛡️ Validate ข้อมูลโครงสร้าง Request Body ก่อนส่งไป Service
  const queryParams = {
    letter_id: searchParams.get("letter_id"),
    school_id: searchParams.get("school_id"),
  };

  const validation = UpdateLeaveStatusSchema.safeParse(queryParams);

  if (!validation.success) {
    const errorData = errorResponse({
      message_th: "ข้อมูลพารามิเตอร์ไม่ถูกต้อง",
      message_en: "Invalid query parameters",
      status: 400,
      error: validation.error.format(),
    });

    return NextResponse.json(
      { ...errorData, status_code: 400 },
      { status: 400 },
    );
  }

  const { letter_id, school_id } = validation.data;

  try {
    /* ✨ เรียกใช้ Service เพื่ออัปเดตสถานะ */
    const result = await LeaveLetterService.updateLeaveStatus(
      letter_id,
      school_id,
      headers,
    );

    const successData = successResponse({
      data: result.data,
      message_th: "อัปเดตสถานะจดหมายลาหยุดสำเร็จ",
      message_en: "Leave letter status updated successfully",
      status: result.status,
    });

    return NextResponse.json(
      { ...successData, status_code: result.status },
      { status: result.status },
    );
  } catch (error: any) {
    const errorData = errorResponse({
      message_th: "ไม่สามารถอัปเดตสถานะจดหมายลาหยุดได้",
      message_en: error.message || "Failed to update leave status",
      status: error.status || 500,
      error: error.data,
    });

    return NextResponse.json(
      { ...errorData, status_code: error.status || 500 },
      { status: error.status || 500 },
    );
  }
}
