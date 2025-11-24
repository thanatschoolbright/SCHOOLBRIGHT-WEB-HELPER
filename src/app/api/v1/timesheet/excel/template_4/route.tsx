import { NextRequest, NextResponse } from "next/server";
import { TimesheetAuditReportService } from "@/services/backend/timesheet/audit-report.service";

/**
 * POST /api/v1/timesheet/excel/template_4
 * ส่งออกรายงานสำหรับ Audit พร้อมภาพรวมและหลักฐานการลงเวลา
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { start_date, end_date } = body;

    // Validate required fields
    if (!start_date || !end_date) {
      return NextResponse.json(
        {
          message_th: "กรุณาระบุช่วงวันที่",
          message_en: "Date range is required",
        },
        { status: 400 }
      );
    }

    // สร้าง Excel file (service should return a Buffer/ArrayBuffer)
    const excelBuffer = await TimesheetAuditReportService.generateAuditReport({
      start_date,
      end_date,
    });

    const fileName = `timesheet-audit-report_${start_date.replace(
      /-/g,
      ""
    )}_${end_date.replace(/-/g, "")}.xlsx`;

    return new NextResponse(excelBuffer as any, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error: any) {
    console.error("Error generating audit report:", error);

    return NextResponse.json(
      {
        message_th: error.message || "เกิดข้อผิดพลาดในการสร้างรายงาน",
        message_en: error.message || "Error generating report",
      },
      { status: 500 }
    );
  }
}
