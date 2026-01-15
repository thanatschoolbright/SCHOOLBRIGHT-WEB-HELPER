import { NextRequest, NextResponse } from "next/server";
import { Service } from "@services/backend/timesheet/project-status.service";
import { successResponse, errorResponse } from "@helpers/api/response";

export async function POST(request: NextRequest) {
  try {
    const data = await Service.findAll();
    return NextResponse.json(
      successResponse({
        data,
        message_en: "Fetched successfully",
        message_th: "ดึงข้อมูลสำเร็จ",
      })
    );
  } catch (err: any) {
    return NextResponse.json(
      errorResponse({
        message_en: err.message,
        message_th: "เกิดข้อผิดพลาดในการดึงข้อมูล",
        error: err,
      })
    );
  }
}
