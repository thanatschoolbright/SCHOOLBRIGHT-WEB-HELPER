import { errorResponse, successResponse } from "@/helpers/api/response";
import prisma from "@helpers/prisma";
import { NextResponse } from "next/server";

const FIFTEEN_MIN_IN_MS = 15 * 60 * 1000;

// GET handler ดึงสถิติ Dashboard ภาพรวมอุปกรณ์ทั้งหมด ไม่ขึ้นกับ filter ใดๆ
export async function GET() {
  try {
    const now = new Date();

    const allDevices = await prisma.deviceDailyStatus.findMany({
      select: {
        Online: true,
        OnlineTime: true,
        Login: true,
        AppName: true,
        AppVersion: true,
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
        (onlineTime ? now.getTime() - onlineTime.getTime() <= FIFTEEN_MIN_IN_MS : false);

      if (isOnlineDynamic) online++;
      else offline++;
      if (device.Login) login++;
      schoolSet.add(device.SchoolID);
    }

    const onlineRate = total === 0 ? 0 : Math.round((online / total) * 100);
    const totalSchools = schoolSet.size;

    return NextResponse.json(
      successResponse({
        data: { total, online, offline, login, onlineRate, totalSchools },
        message_th: "ดึงข้อมูล Dashboard สำเร็จ",
        message_en: "Dashboard summary retrieved successfully",
      }),
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
        message_en: "Internal Server Error",
        error: error.message || error,
      }),
      { status: 500 },
    );
  }
}
