import { errorResponse, successResponse } from "@/helpers/api/response";
import { sanitizeForwardHeaders } from "@/services/api-header";
import { NextRequest, NextResponse } from "next/server";
import { LeaveManagementService } from "../service/leave-management-service";
import { ReadLeaveManagementSchema } from "../validation/leave-management-schema";

/**
 * API สำหรับดึงข้อมูลการลาในระดับผู้ดูแลระบบ (Admin)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const headers = sanitizeForwardHeaders(request);

  // เตรียม Payload สำหรับตรวจสอบให้ตรงกับ apimobiledev
  const queryParams = {
    userid: searchParams.get("userid") || undefined,
    schoolid: searchParams.get("schoolid") || undefined,
  };

  const validation = ReadLeaveManagementSchema.safeParse(queryParams);

  if (!validation.success) {
    return NextResponse.json(
      errorResponse({
        message_th: "พารามิเตอร์ไม่ถูกต้อง",
        message_en: "Invalid parameters",
        status: 400,
        error: validation.error.format(),
      }),
      { status: 400 },
    );
  }

  try {
    const result = await LeaveManagementService.findAll(
      validation.data,
      headers,
    );

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "ดึงข้อมูลการลาสำเร็จ",
        message_en: "Leave data retrieved successfully",
      }),
    );
  } catch (err: any) {
    const errorBody = errorResponse({
      message_th: "เกิดข้อผิดพลาดในการดึงข้อมูลการลา",
      message_en: err.message,
      error: err,
    });
    return NextResponse.json(errorBody, { status: errorBody.status || 500 });
  }
}
