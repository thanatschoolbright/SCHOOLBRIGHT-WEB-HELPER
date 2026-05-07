import { auth } from "@/auth";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { validateRequest } from "@/helpers/api/validate.request";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { NextRequest, NextResponse } from "next/server";
import { deviceNotifyService } from "../device-notify.service";
import { ToggleDeviceNotifySchema } from "../device-notify.schema";

// เปิด/ปิดการแจ้งเตือนของอุปกรณ์รายเครื่อง
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        errorResponse({ status: 401, message_th: "กรุณาเข้าสู่ระบบก่อน", message_en: "Unauthorized" }),
        { status: 401 },
      );
    }

    const { data, error } = await validateRequest(request, ToggleDeviceNotifySchema);
    if (error) return error;

    const userId = session.user.id ? Number(session.user.id) : null;
    const result = await deviceNotifyService.toggleDeviceNotify(data, userId);

    // บันทึก activity log ลงตาราง api_log (timesheet DB)
    PrismaTimesheet.apiLog.create({
      data: {
        request_time: new Date(),
        method: "POST",
        endpoint: "/api/v1/hardware/machine-monitoring/device-notify-setting/toggle",
        url: "/api/v1/hardware/machine-monitoring/device-notify-setting/toggle",
        service_name: "machine-monitoring",
        request_body: { school_id: data.school_id, device_id: data.device_id, notify_enabled: data.notify_enabled },
        status_code: 200,
        is_success: true,
        called_by: String(session.user.id ?? "unknown"),
      },
    }).catch(() => undefined);

    const actionText = result.notify_enabled ? "เปิด" : "ปิด";

    return NextResponse.json(
      successResponse({
        message_th: `${actionText}การแจ้งเตือนอุปกรณ์ ${data.device_id} สำเร็จ`,
        message_en: `Device notification ${result.notify_enabled ? "enabled" : "disabled"} successfully`,
        data: {
          school_id: result.school_id,
          device_id: result.device_id,
          notify_enabled: result.notify_enabled,
        },
      }),
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[DEVICE_NOTIFY_TOGGLE_ERROR]", err);
    return NextResponse.json(
      errorResponse({ status: 500, message_th: "เกิดข้อผิดพลาดภายในระบบ", message_en: message }),
      { status: 500 },
    );
  }
}
