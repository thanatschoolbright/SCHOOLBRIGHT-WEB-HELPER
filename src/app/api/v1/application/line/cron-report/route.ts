import { errorResponse, successResponse } from "@/helpers/api/response";
import prisma from "@helpers/prisma";
import {
  buildDeviceStatusFlexMessage,
  buildOfflineDetailTextMessage,
  linePushMessage,
} from "@services/line/line-push.service";
import axios from "axios";
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
    const reportTime = dayjs().format("DD/MM/YYYY HH:mm") + " น.";

    // ดึงสถิติอุปกรณ์ทั้งหมดจาก DB พร้อม AppName/AppVersion สำหรับแยกกลุ่ม
    const [allDevices, allSchools] = await Promise.all([
      prisma.deviceDailyStatus.findMany({
        select: {
          Online: true,
          OnlineTime: true,
          Login: true,
          SchoolID: true,
          DeviceID: true,
          AppName: true,
          AppVersion: true,
        },
      }),
      prisma.activeSchoolList.findMany({
        select: { nCompany: true, sCompany: true },
      }),
    ]);

    // สร้าง map รหัสโรงเรียน → ชื่อโรงเรียน
    const schoolNameMap = new Map<number, string>(
      allSchools.map((s) => [s.nCompany, s.sCompany ?? `โรงเรียน ${s.nCompany}`]),
    );

    const total = allDevices.length;
    let online = 0;
    let offline = 0;
    let login = 0;
    const schoolSet = new Set<number>();
    const groupMap = new Map<
      string,
      { online: number; offline: number; login: number; total: number }
    >();
    // จัดกลุ่มเครื่อง offline ตาม SchoolID
    const offlineBySchool = new Map<
      number,
      { schoolName: string; deviceIds: string[] }
    >();

    for (const device of allDevices) {
      const onlineTime = device.OnlineTime ? new Date(device.OnlineTime) : null;
      const isOnlineDynamic =
        device.Online === true ||
        (onlineTime
          ? now.getTime() - onlineTime.getTime() <= FIFTEEN_MIN_IN_MS
          : false);

      if (isOnlineDynamic) online++;
      else {
        offline++;
        // เก็บรายละเอียดเครื่อง offline แยกตามโรงเรียน
        const entry = offlineBySchool.get(device.SchoolID) ?? {
          schoolName:
            schoolNameMap.get(device.SchoolID) ?? `โรงเรียน ${device.SchoolID}`,
          deviceIds: [],
        };
        entry.deviceIds.push(device.DeviceID);
        offlineBySchool.set(device.SchoolID, entry);
      }
      if (device.Login) login++;
      schoolSet.add(device.SchoolID);

      // จัดกลุ่มตาม AppName + AppVersion
      const appKey = `${device.AppName ?? "ไม่ระบุแอป"}|||${
        device.AppVersion ?? "-"
      }`;
      const g = groupMap.get(appKey) ?? {
        online: 0,
        offline: 0,
        login: 0,
        total: 0,
      };
      g.total++;
      if (isOnlineDynamic) g.online++;
      else g.offline++;
      if (device.Login) g.login++;
      groupMap.set(appKey, g);
    }

    const onlineRate = total === 0 ? 0 : Math.round((online / total) * 100);

    const appGroups = Array.from(groupMap.entries())
      .map(([key, g]) => {
        const [appName, appVersion] = key.split("|||");
        return {
          appName: appName ?? "ไม่ระบุแอป",
          appVersion: appVersion ?? "-",
          ...g,
          onlineRate:
            g.total === 0 ? 0 : Math.round((g.online / g.total) * 100),
        };
      })
      .sort((a, b) => a.appName.localeCompare(b.appName));

    const stats = {
      total,
      online,
      offline,
      login,
      onlineRate,
      totalSchools: schoolSet.size,
      reportTime,
      appGroups,
    };

    const messages: object[] = [buildDeviceStatusFlexMessage(stats)];

    // ถ้ามีเครื่อง offline ให้แนบ plain-text รายละเอียดต่อท้าย
    if (offlineBySchool.size > 0) {
      messages.push(
        buildOfflineDetailTextMessage(offlineBySchool, reportTime),
      );
    }

    await linePushMessage(groupId, messages);

    return NextResponse.json(
      successResponse({
        data: stats,
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
