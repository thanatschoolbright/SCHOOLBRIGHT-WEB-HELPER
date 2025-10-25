import { NextRequest, NextResponse } from "next/server";
import { TimesheetProjectSummaryService } from "../../../../../../services/backend/timesheet/project-summary.service";

/**
 * POST /api/v1/timesheet/excel/template_2
 * ส่งออกรายงานสรุป Timesheet แยกตามโปรเจ็ค
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { start_date, end_date, export_type } = body;

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

    if (!export_type || !["project", "sub_project"].includes(export_type)) {
      return NextResponse.json(
        {
          message_th: "กรุณาระบุประเภทรายงาน",
          message_en: "Export type is required",
        },
        { status: 400 }
      );
    }

    // สร้าง Excel file
    const excelBuffer = await TimesheetProjectSummaryService.generateProjectSummaryExcel({
      start_date,
      end_date,
      export_type,
    });

    // สร้างชื่อไฟล์
    const typeLabel = export_type === "project" ? "project" : "subproject";
    const fileName = `timesheet-${typeLabel}-summary_${start_date.replace(/-/g, '')}_${end_date.replace(/-/g, '')}.xlsx`;

    // ส่งไฟล์กลับ
    return new NextResponse(excelBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });

  } catch (error: any) {
    console.error("Error generating project summary:", error);

    return NextResponse.json(
      {
        message_th: error.message || "เกิดข้อผิดพลาดในการสร้างรายงาน",
        message_en: error.message || "Error generating report",
      },
      { status: 500 }
    );
  }
}