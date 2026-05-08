import { NextRequest, NextResponse } from "next/server";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { handleError } from "@/helpers/controller/handle-error.params";
import { auth } from "@/auth";

// ✨ ลบ log การตรวจสอบสถานะ Server เฉพาะวันก่อนหน้า (ไม่แตะ log วันนี้)
// เรียกได้หลังจาก aggregate เสร็จแล้วเท่านั้น เพื่อประหยัดพื้นที่
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        errorResponse({ status: 401, message_th: "กรุณาเข้าสู่ระบบ", message_en: "Unauthorized" }),
        { status: 401 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // นับก่อนลบเพื่อรายงานผล
    const countBefore = await PrismaTimesheet.apiLog.count({
      where: {
        service_name: "SERVER_STATUS_MONITOR",
        request_time: { lt: today },
      },
    });

    if (countBefore === 0) {
      return NextResponse.json(
        successResponse({
          data: { deleted_count: 0 },
          message_th: "ไม่มี log เก่าให้ลบ",
          message_en: "No old log entries to delete",
        }),
        { status: 200 }
      );
    }

    // ลบเฉพาะ log ที่เก่ากว่าวันนี้ (เก็บ log วันนี้ไว้)
    const result = await PrismaTimesheet.apiLog.deleteMany({
      where: {
        service_name: "SERVER_STATUS_MONITOR",
        request_time: { lt: today },
      },
    });

    return NextResponse.json(
      successResponse({
        data: { deleted_count: result.count },
        message_th: `ลบ log เรียบร้อยแล้ว ${result.count} รายการ`,
        message_en: `Deleted ${result.count} log entries`,
      }),
      { status: 200 }
    );
  } catch (err) {
    return handleError(err, "[SERVER_STATUS_LOG_DELETE_ERROR]");
  }
}
