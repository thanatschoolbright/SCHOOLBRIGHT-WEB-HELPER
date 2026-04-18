import { errorResponse, successResponse } from "@/helpers/api/response";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { NextResponse } from "next/server";
import { fetchDeviceStats, sendMonitoringEmail } from "../../service/machine-monitoring.service";

dayjs.locale("th");

// GET handler — ดึงข้อมูลจาก DB แล้วส่งรายงานสถานะเครื่อง POS ทางอีเมล
export async function GET() {
  try {
    const reportTime = dayjs().format("DD/MM/YYYY HH:mm") + " น.";
    const { stats, schoolMap } = await fetchDeviceStats();
    const emailResult = await sendMonitoringEmail(stats, schoolMap, reportTime);

    if (!emailResult.success) {
      return NextResponse.json(
        errorResponse({
          status: 500,
          message_th: "ส่งอีเมลรายงานสถานะเครื่อง POS ไม่สำเร็จ",
          message_en: "Failed to send machine monitoring email",
          error: emailResult.error,
        }),
        { status: 500 },
      );
    }

    return NextResponse.json(
      successResponse({
        data: {
          total: stats.total,
          online: stats.online,
          offline: stats.offline,
          online_rate: stats.onlineRate,
        },
        message_th: "ส่งอีเมลรายงานสถานะเครื่อง POS สำเร็จ",
        message_en: "Machine monitoring email sent successfully",
      }),
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดขณะส่งรายงานสถานะเครื่อง POS",
        message_en: "Failed to send machine monitoring report",
        error: message,
      }),
      { status: 500 },
    );
  }
}
