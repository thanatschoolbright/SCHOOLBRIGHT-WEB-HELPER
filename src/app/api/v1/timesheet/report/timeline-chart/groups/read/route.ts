// ✨ API Route สำหรับดึงรายการกลุ่มโครงการ (ใช้เป็น Dropdown)
import { NextResponse } from "next/server";
import { timelineChartService } from "../../_service/timeline-chart-service";

export async function GET() {
  try {
    const data = await timelineChartService.getGroupList();
    return NextResponse.json({
      status_code: 200,
      message_th: "ดึงข้อมูลกลุ่มโครงการสำเร็จ",
      message_en: "Groups retrieved successfully",
      data,
    });
  } catch (error: any) {
    console.error("Group List Error:", error);
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
