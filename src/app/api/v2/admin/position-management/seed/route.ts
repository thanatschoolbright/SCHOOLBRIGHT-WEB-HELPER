import { NextRequest, NextResponse } from "next/server";
import { PositionManagementService } from "../service/position-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function POST(request: NextRequest) {
  try {
    const count = await PositionManagementService.seedTechPositions();

    return NextResponse.json(
      successResponse({
        data: { count },
        message_th: `สร้างตำแหน่งเริ่มต้นสำเร็จ (${count} ตำแหน่ง)`,
        message_en: `Successfully seeded ${count} positions`,
        status: 200,
      }),
    );
  } catch (err: any) {
    return NextResponse.json(
      errorResponse({
        message_th: "เกิดข้อผิดพลาดในการสร้างตำแหน่งเริ่มต้น",
        message_en: "An error occurred while seeding positions",
        error: err,
      }),
    );
  }
}
