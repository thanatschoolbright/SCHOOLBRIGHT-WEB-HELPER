import { NextRequest, NextResponse } from "next/server";
import { OvertimeService } from "../service/overtime.service";
import { errorResponse } from "@/helpers/api/response";
import { validateRequest } from "@helpers/api/validate.request";
import { ExportOvertimeSchema } from "../validation/overtime.validation";

/**
 * POST /api/v1/timesheet/overtime/export
 * สำหรับส่งออกรายการ OT เป็นไฟล์ Excel
 */
export async function POST(request: NextRequest) {
  // ดึงข้อมูลและตรวจสอบความถูกต้องของ request body
  const { data, error } = await validateRequest(request, ExportOvertimeSchema);
  if (error) return error;

  try {
    const { from, to, status, requester_id } = data;

    // เรียกใช้งาน Service เพื่อสร้าง Excel Buffer
    const excelBuffer = await OvertimeService.generateExportExcel({
      from,
      to,
      status,
      requester_id,
    });

    const fileName = OvertimeService.generateEnterpriseFileName(from);

    // ส่งคืนไฟล์ Excel
    return new NextResponse(excelBuffer as any, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error: any) {
    // กรณีเกิดข้อผิดพลาด ส่งคืน error response ตามมาตรฐาน
    return NextResponse.json(
      errorResponse({
        message_en: error.message || "Error exporting overtime data",
        message_th: error.message || "เกิดข้อผิดพลาดในการส่งออกข้อมูล OT",
        error,
      }),
      { status: 500 },
    );
  }
}
