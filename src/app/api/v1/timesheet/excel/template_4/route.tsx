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
        { status: 400 },
      );
    }

    // สร้าง Excel file (service should return a Buffer/ArrayBuffer)
    const excelBuffer = await TimesheetAuditReportService.generateAuditReport({
      start_date,
      end_date,
    });

    // Helper to format date as DD/MM/YYYY (Buddhist Era)
    const formatDateThai = (dateStr: string) => {
      // Input expected: YYYY-MM-DD
      const [year, month, day] = dateStr.split("-");
      const thYear = parseInt(year, 10) + 543;
      return `${day}/${month}/${thYear}`;
    };

    const formattedStart = formatDateThai(start_date);
    const formattedEnd = formatDateThai(end_date);
    const fileName = `รายงานการทำงานของพนักงาน วันที่ ${formattedStart} ถึง ${formattedEnd}.xlsx`;
    const encodedFileName = encodeURIComponent(fileName);

    return new NextResponse(excelBuffer as any, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedFileName}`,
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
      { status: 500 },
    );
  }
}
