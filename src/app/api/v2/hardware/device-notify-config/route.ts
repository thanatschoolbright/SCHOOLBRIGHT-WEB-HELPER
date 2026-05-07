import { auth } from "@/auth";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { handleError } from "@/helpers/controller/handle-error.params";
import { NextResponse } from "next/server";
import { deviceNotifyConfigService } from "./device-notify-config.service";

// ✨ GET — ดึงช่วงเวลาแจ้งเตือนและช่วงห่างทั้งหมดจาก DB
export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      errorResponse({ status: 401, message_th: "กรุณาเข้าสู่ระบบ", message_en: "Unauthorized" }),
      { status: 401 },
    );
  }

  try {
    const config = await deviceNotifyConfigService.getConfig();
    return NextResponse.json(
      successResponse({
        message_th: "ดึงการตั้งค่าการแจ้งเตือนสำเร็จ",
        message_en: "Notification config retrieved",
        data: config,
      }),
      { status: 200 },
    );
  } catch (err: unknown) {
    return handleError(err, "GET /api/v2/hardware/device-notify-config");
  }
}
