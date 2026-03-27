import { NextRequest, NextResponse } from "next/server";
import { getPMDashboardAnalytics } from "./_service/dashboard-service";
import { PMDashboardQuerySchema } from "./_validation/dashboard-schema";

/**
 * ✨ [GET] PM Dashboard Report API
 * @description ดึงข้อมูลภาพรวมสุขภาพโครงการ (Project Health) และภาระงานพนักงาน (Workload)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      start_date: searchParams.get("start_date") || undefined,
      end_date: searchParams.get("end_date") || undefined,
      group_id: searchParams.get("group_id") || undefined,
    };

    // 1. ตรวจสอบเงื่อนไขการดึงข้อมูล
    const validationResult = PMDashboardQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          status_code: 400,
          message_th: "พารามิเตอร์ไม่ถูกต้อง",
          errors: validationResult.error.format(),
        },
        { status: 400 },
      );
    }

    // 2. เรียก Service ดึงข้อมูลจริงจาก Prisma
    const analyticsData = await getPMDashboardAnalytics(validationResult.data);

    // 3. ส่งข้อมูลกลับตามโครงสร้างมาตรฐาน
    return NextResponse.json({
      status_code: 200,
      message_th: "ดึงข้อมูลรีพอร์ตสำเร็จ",
      message_en: "Successfully retrieved PM dashboard report.",
      data: analyticsData,
    });
  } catch (error: any) {
    console.error("[PM DASHBOARD API ERR]:", error);
    return NextResponse.json(
      {
        status_code: 500,
        message_th: "เกิดข้อผิดพลาดในการโหลดข้อมูลจากฐานข้อมูล",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
