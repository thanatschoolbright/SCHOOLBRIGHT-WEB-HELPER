import { errorResponse, successResponse } from "@/helpers/api/response";
import { validateRequest } from "@/helpers/api/validate.request";
import { Service } from "@/services/backend/timesheet/report/capturable/capturable.service";
import { NextRequest, NextResponse } from "next/server";
import { ReportDateSchema } from "../../capturable.type";

// ** ROUTE
export async function POST(request: NextRequest) {
  // 1. Validate Request Body
  const { data, error } = await validateRequest<any>(request, ReportDateSchema);
  if (error) {
    return error;
  }

  try {
    // 2. Call Service
    const result = await Service.getSummary(data.start_date, data.end_date);

    // 3. Return Success
    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "ดึงข้อมูลรายงานสำเร็จ",
        message_en: "Get capturable report successfully",
      }),
    );
  } catch (error: any) {
    // 4. Return Error
    return NextResponse.json(errorResponse({ error }));
  }
}
