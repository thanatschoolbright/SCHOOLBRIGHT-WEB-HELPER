import { NextRequest, NextResponse } from "next/server";
import { getOvertimeAnalytics } from "../_service/overtime-service";
import { OvertimeAnalyticsSchema } from "../_validation/analytics-schema";

/**
 * ✨ [GET] ดึงข้อมูลวิเคราะห์ Dashboard (Advanced Analytics & Trends)
 * @description รองรับการกรองช่วงวันที่ (start_date, end_date) และแผนก (department_id)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      start_date: searchParams.get("start_date") || undefined,
      end_date: searchParams.get("end_date") || undefined,
      department_id: searchParams.get("department_id") || undefined,
    };

    // 1. ตรวจสอบความถูกต้องของข้อมูลผ่าน Schema
    const validatedDataResult = OvertimeAnalyticsSchema.safeParse(queryParams);
    if (!validatedDataResult.success) {
      return NextResponse.json(
        {
          status_code: 400,
          message_th: "ข้อมูลที่ส่งมาไม่ถูกต้อง (Validation Failed)",
          message_en: "Invalid query parameters provided.",
          errors: validatedDataResult.error.format(),
        },
        { status: 400 },
      );
    }

    // 2. เรียกใช้ Service เพื่อดึงข้อมูล Analytics
    const analyticsResult = await getOvertimeAnalytics(
      validatedDataResult.data,
    );

    // 3. คืนค่าตามโครงสร้างมาตรฐาน
    return NextResponse.json({
      status_code: 200,
      message_th: "ดึงข้อมูลวิเคราะห์สำเร็จ",
      message_en: "Successfully retrieved overtime analytics.",
      data: analyticsResult,
    });
  } catch (error: any) {
    console.error("[API OVERTIME ANALYTICS ERR]:", error);
    return NextResponse.json(
      {
        status_code: 500,
        message_th: "เกิดข้อผิดพลาดในการดึงข้อมูลวิเคราะห์จากระบบพื้นฐาน",
        message_en: "Internal server error while fetching analytics.",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
