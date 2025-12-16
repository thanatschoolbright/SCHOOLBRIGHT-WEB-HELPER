import { NextRequest, NextResponse } from "next/server";
import { ExcelService } from "@/services/backend/timesheet/capturable/capturable.report.service"; // Service สร้าง Excel ใหม่
import { validateRequest } from "@/helpers/api/validate.request";
import { errorResponse } from "@/helpers/api/response";
import { z } from "zod";
import { Service } from "@/services/backend/timesheet/capturable/capturable.service";
import { ReportDateSchema } from "../../capturable.type";

export async function POST(request: NextRequest) {
  // 1. Validate Input
  const { data: body, error } = await validateRequest(
    request,
    ReportDateSchema
  );
  if (error) {
    return error;
  }

  try {
    // 2. ดึงข้อมูล (Reuse Service เดิม)
    const dataResult = await Service.getProjectStats(
      body.start_date,
      body.end_date
    );

    // 3. สร้าง Excel Buffer
    const buffer = await ExcelService.generateCapturableReport(dataResult);

    // 4. Return ไฟล์ Excel กลับไป
    // การส่งไฟล์ต้องใช้ new NextResponse โดยตรงเพื่อ set header ให้ถูกต้อง
    const filename = `report-${body.start_date}-to-${body.end_date}.xlsx`;

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(errorResponse({ error }));
  }
}
