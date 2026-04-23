import { errorResponse, successResponse } from "@/helpers/api/response";
import { sanitizeForwardHeaders } from "@/services/api-header";
import { NextRequest, NextResponse } from "next/server";
import { LeaveManagementService } from "../service/leave-management-service";
import { ApproveLeaveManagementSchema } from "../validation/leave-management-schema";

/**
 * API สำหรับอนุมัติ / ไม่อนุมัติใบลาในระดับผู้ดูแลระบบ (Admin)
 * approve = "1" คืออนุมัติ, approve = "0" คือไม่อนุมัติ
 */
export async function POST(request: NextRequest) {
  const headers = sanitizeForwardHeaders(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const validation = ApproveLeaveManagementSchema.safeParse(body);

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
    const result = await LeaveManagementService.confirmLeave(
      validation.data,
      headers,
    );

    const actionLabel =
      validation.data.approve === "1" ? "อนุมัติ" : "ไม่อนุมัติ";

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: `${actionLabel}ใบลาสำเร็จ`,
        message_en:
          validation.data.approve === "1"
            ? "Leave approved successfully"
            : "Leave rejected successfully",
      }),
    );
  } catch (err: any) {
    const errorBody = errorResponse({
      message_th: "เกิดข้อผิดพลาดในการดำเนินการใบลา",
      message_en: err.message,
      error: err,
    });
    return NextResponse.json(errorBody, { status: errorBody.status || 500 });
  }
}
