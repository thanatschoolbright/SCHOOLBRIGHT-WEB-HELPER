import { NextRequest, NextResponse } from "next/server";
import { PositionManagementService } from "../service/position-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      throw new Error("ต้องระบุ ID");
    }

    const result = await PositionManagementService.delete(Number(body.id));

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "ลบตำแหน่งงานสำเร็จ",
        message_en: "Successfully deleted position",
        status: 200,
      }),
    );
  } catch (err: any) {
    return NextResponse.json(
      errorResponse({
        message_th: "เกิดข้อผิดพลาดในการลบตำแหน่ง",
        message_en: "An error occurred while deleting position",
        error: err,
      }),
    );
  }
}
