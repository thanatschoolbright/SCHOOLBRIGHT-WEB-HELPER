import { NextRequest, NextResponse } from "next/server";
import { UserManagementService } from "../service/user-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function GET(request: NextRequest) {
  try {
    const constants = await UserManagementService.findConstants();

    return NextResponse.json(
      successResponse({
        data: constants,
        message_th: "ดึงข้อมูลคงที่สำเร็จ",
        message_en: "Constants retrieved successfully",
      }),
    );
  } catch (err: any) {
    return NextResponse.json(
      errorResponse({
        message_th: "เกิดข้อผิดพลาดในการดึงข้อมูล",
        message_en: err.message,
        error: err,
      }),
      { status: 500 },
    );
  }
}
