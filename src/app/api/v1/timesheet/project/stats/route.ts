import { NextRequest, NextResponse } from "next/server";
import { Service } from "@services/backend/timesheet/project.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function POST(request: NextRequest) {
  try {
    const stats = await Service.getStats();

    return NextResponse.json(
      successResponse({
        data: stats,
        message_en: "Project statistics retrieved successfully",
        message_th: "เรียกดูข้อมูลสถิติโครงการสำเร็จ",
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      errorResponse({
        message_en: error.message,
        message_th: "เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ",
        error,
      })
    );
  }
}
