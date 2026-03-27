// ✨ API Route สำหรับดึงข้อมูล Project Timeline Chart
import { NextRequest, NextResponse } from "next/server";
import { timelineChartService } from "../_service/timeline-chart-service";
import { timelineChartSchema } from "../_validation/timeline-chart-schema";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = {
      start_date: searchParams.get("start_date") || undefined,
      end_date: searchParams.get("end_date") || undefined,
      project_id: searchParams.get("project_id") || undefined,
    };

    // ✨ Validation
    const validatedQuery = timelineChartSchema.safeParse(query);
    if (!validatedQuery.success) {
      return NextResponse.json(
        {
          status_code: 400,
          message_th: "ข้อมูลไม่ถูกต้อง",
          message_en: "Invalid request data",
          data: validatedQuery.error.format(),
        },
        { status: 400 },
      );
    }

    // ✨ Call Service
    const data = await timelineChartService.getProjectTimeline(
      validatedQuery.data,
    );

    return NextResponse.json({
      status_code: 200,
      message_th: "ดึงข้อมูลสำเร็จ",
      message_en: "Data retrieved successfully",
      data: data,
    });
  } catch (error: any) {
    console.error("Timeline Chart Error:", error);
    return NextResponse.json(
      {
        status_code: 500,
        message_th: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
        message_en: "Internal Server Error",
        data: error.message,
      },
      { status: 500 },
    );
  }
}
