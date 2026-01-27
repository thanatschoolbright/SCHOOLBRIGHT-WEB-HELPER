import { NextRequest, NextResponse } from "next/server";
import { LegacyUserService } from "@services/backend/user-management/legacy-user.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

// API to push update to Legacy System
export async function POST(request: NextRequest) {
  try {
    // Expect form-data or json?
    // If receiving JSON from frontend, we convert to FormData for Legacy API in service.
    const body = await request.json();

    // Call legacy service
    const result = await LegacyUserService.updateLegacyUser(body);

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "อัปเดตข้อมูลไปยังระบบเก่าสำเร็จ",
        message_en: "Legacy system updated successfully",
      }),
    );
  } catch (err: any) {
    return NextResponse.json(
      errorResponse({
        message_th: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลระบบเก่า",
        message_en: err.message,
        error: err,
      }),
    );
  }
}
