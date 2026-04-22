import { errorResponse, successResponse } from "@/helpers/api/response";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import {
  buildDeviceStatusReport,
  linePushMessage,
} from "@services/line/line-push.service";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

// GET handler — ดึงข้อมูลจาก DB แล้วส่งรายงานสถานะอุปกรณ์ไปยัง LINE Group
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      errorResponse({
        status: 401,
        message_th: "ไม่มีสิทธิ์เข้าถึง",
        message_en: "Unauthorized",
      }),
      { status: 401 },
    );
  }

  // ลำดับความสำคัญ: query param > env var > active group ใน DB
  const { searchParams } = new URL(request.url);
  let groupId =
    searchParams.get("group_id") ??
    process.env.LINE_MONITORING_GROUP_ID ??
    null;

  if (!groupId) {
    // fallback: ดึง group ล่าสุดที่ active จาก DB
    const activeGroup = await PrismaTimesheet.lineGroup
      .findFirst({
        where: { is_active: true },
        orderBy: { updated_at: "desc" },
      })
      .catch(() => null);
    groupId = activeGroup?.group_id ?? null;
  }

  if (!groupId) {
    return NextResponse.json(
      errorResponse({
        status: 503,
        message_th:
          "ยังไม่ได้ตั้งค่า LINE Group เป้าหมาย กรุณาเลือกกลุ่มก่อนส่งรายงาน",
        message_en: "LINE target group is not configured",
      }),
      { status: 503 },
    );
  }

  try {
    const messages = await buildDeviceStatusReport();
    await linePushMessage(groupId, messages);

    return NextResponse.json(
      successResponse({
        data: { group_id: groupId },
        message_th: "ส่งรายงานไปยัง LINE สำเร็จ",
        message_en: "Report sent to LINE successfully",
      }),
      { status: 200 },
    );
  } catch (error: unknown) {
    const errorMessage = axios.isAxiosError(error)
      ? JSON.stringify(error.response?.data ?? error.message)
      : error instanceof Error
      ? error.message
      : "Unknown error";

    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดขณะส่งรายงาน LINE",
        message_en: "Failed to send LINE report",
        error: errorMessage,
      }),
      { status: 500 },
    );
  }
}
