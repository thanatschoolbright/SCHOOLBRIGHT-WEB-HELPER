import { NextRequest, NextResponse } from "next/server";
import { ExcelService } from "@/services/backend/timesheet/capturable/capturable.report.service";
import { validateRequest } from "@/helpers/api/validate.request";
import { errorResponse } from "@/helpers/api/response";
import { Service } from "@/services/backend/timesheet/capturable/capturable.service";
import { ReportDateSchema } from "../../capturable.type";

export async function POST(request: NextRequest) {
  const { data: body, error } = await validateRequest(
    request,
    ReportDateSchema
  );

  if (error) {
    return error;
  }

  try {
    const dataResult = await Service.getProjectStats(
      body.start_date,
      body.end_date
    );

    const buffer = await ExcelService.generateCapturableReport(
      dataResult,
      body.start_date,
      body.end_date
    );

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
