import { errorResponse, successResponse } from "@/helpers/api/response";
import {
  buildDeviceStatusReport,
  linePushMessage,
} from "@services/line/line-push.service";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

// GET handler สำหรับ Vercel Cron Job — ส่งรายงานสถานะอุปกรณ์ไปยัง LINE Group ทุก 10 นาที
export async function GET(request: NextRequest) {
  // ป้องกันการเรียกจากภายนอก ต้องมี Authorization header ตรงกับ CRON_SECRET
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

  const groupId = process.env.LINE_MONITORING_GROUP_ID;
  if (!groupId) {
    return NextResponse.json(
      errorResponse({
        status: 503,
        message_th: "ยังไม่ได้ตั้งค่า LINE_MONITORING_GROUP_ID",
        message_en: "LINE_MONITORING_GROUP_ID is not configured",
      }),
      { status: 503 },
    );
  }

  try {
    const messages = await buildDeviceStatusReport();
    await linePushMessage(groupId, messages);

    return NextResponse.json(
      successResponse({
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
