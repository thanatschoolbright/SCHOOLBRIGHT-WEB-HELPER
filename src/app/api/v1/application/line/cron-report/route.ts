import { errorResponse, successResponse } from "@/helpers/api/response";
import prisma from "@helpers/prisma";
import {
  buildDeviceStatusFlexMessage,
  linePushMessage,
} from "@services/line/line-push.service";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { NextRequest, NextResponse } from "next/server";

dayjs.locale("th");

const FIFTEEN_MIN_IN_MS = 15 * 60 * 1000;

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
    const now = new Date();
    const reportTime =
      dayjs().format("DD/MM/YYYY HH:mm") + " น.";

    // ดึงสถิติอุปกรณ์ทั้งหมดจาก DB
    const allDevices = await prisma.deviceDailyStatus.findMany({
      select: {
        Online: true,
        OnlineTime: true,
        Login: true,
        SchoolID: true,
      },
    });

    const total = allDevices.length;
    let online = 0;
    let offline = 0;
    let login = 0;
    const schoolSet = new Set<number>();

    for (const device of allDevices) {
      const onlineTime = device.OnlineTime ? new Date(device.OnlineTime) : null;
      const isOnlineDynamic =
        device.Online === true ||
        (onlineTime
          ? now.getTime() - onlineTime.getTime() <= FIFTEEN_MIN_IN_MS
          : false);

      if (isOnlineDynamic) online++;
      else offline++;
      if (device.Login) login++;
      schoolSet.add(device.SchoolID);
    }

    const onlineRate = total === 0 ? 0 : Math.round((online / total) * 100);
    const stats = {
      total,
      online,
      offline,
      login,
      onlineRate,
      totalSchools: schoolSet.size,
      reportTime,
    };

    const flexMessage = buildDeviceStatusFlexMessage(stats);
    await linePushMessage(groupId, [flexMessage]);

    return NextResponse.json(
      successResponse({
        data: stats,
        message_th: "ส่งรายงานไปยัง LINE สำเร็จ",
        message_en: "Report sent to LINE successfully",
      }),
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดขณะส่งรายงาน LINE",
        message_en: "Failed to send LINE report",
        error: error.message || error,
      }),
      { status: 500 },
    );
  }
}
