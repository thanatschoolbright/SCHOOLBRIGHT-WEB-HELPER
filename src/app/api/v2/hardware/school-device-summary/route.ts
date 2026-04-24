import { errorResponse, successResponse } from "@/helpers/api/response";
import prisma from "@helpers/prisma";
import { NextResponse } from "next/server";

const FIFTEEN_MIN_IN_MS = 15 * 60 * 1000;

export interface SchoolDeviceSummaryItem {
  school_id: number;
  school_name: string;
  online: number;
  offline: number;
  total: number;
  devices: {
    device_id: string;
    app_name: string;
    app_version: string;
    note: string | null;
    is_online: boolean;
    is_login: boolean;
    online_time: string | null;
  }[];
}

// GET handler — ดึงสรุปสถานะอุปกรณ์จัดกลุ่มตามโรงเรียน พร้อมรายละเอียดแต่ละเครื่อง
export async function GET(): Promise<NextResponse> {
  try {
    const now = new Date();

    const [allDevices, allSchools] = await Promise.all([
      prisma.deviceDailyStatus.findMany({
        select: {
          SchoolID: true,
          DeviceID: true,
          AppName: true,
          AppVersion: true,
          Note: true,
          Online: true,
          OnlineTime: true,
          Login: true,
        },
        orderBy: [{ SchoolID: "asc" }, { AppName: "asc" }, { DeviceID: "asc" }],
      }),
      prisma.activeSchoolList.findMany({
        select: { nCompany: true, sCompany: true },
      }),
    ]);

    // สร้าง Map school_id → school_name
    const schoolNameMap = new Map<number, string>(
      allSchools.map((s) => [
        s.nCompany,
        s.sCompany ?? `โรงเรียน ${s.nCompany}`,
      ]),
    );

    // จัดกลุ่มอุปกรณ์ตาม SchoolID
    const schoolMap = new Map<number, SchoolDeviceSummaryItem>();

    for (const device of allDevices) {
      const onlineTime = device.OnlineTime ? new Date(device.OnlineTime) : null;
      const isOnline =
        device.Online === true ||
        (onlineTime
          ? now.getTime() - onlineTime.getTime() <= FIFTEEN_MIN_IN_MS
          : false);

      if (!schoolMap.has(device.SchoolID)) {
        schoolMap.set(device.SchoolID, {
          school_id: device.SchoolID,
          school_name:
            schoolNameMap.get(device.SchoolID) ?? `โรงเรียน ${device.SchoolID}`,
          online: 0,
          offline: 0,
          total: 0,
          devices: [],
        });
      }

      const entry = schoolMap.get(device.SchoolID)!;
      entry.total++;
      if (isOnline) entry.online++;
      else entry.offline++;

      entry.devices.push({
        device_id: device.DeviceID,
        app_name: device.AppName ?? "ไม่ระบุแอป",
        app_version: device.AppVersion ?? "-",
        note: device.Note ?? null,
        is_online: isOnline,
        is_login: device.Login,
        online_time: device.OnlineTime?.toISOString() ?? null,
      });
    }

    // เรียงลำดับตาม offline มากสุดก่อน
    const data = Array.from(schoolMap.values()).sort(
      (a, b) => b.offline - a.offline || a.school_id - b.school_id,
    );

    return NextResponse.json(
      successResponse({
        data,
        message_th: "ดึงข้อมูลสรุปอุปกรณ์ตามโรงเรียนสำเร็จ",
        message_en: "School device summary fetched successfully",
      }),
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "ไม่สามารถดึงข้อมูลสรุปอุปกรณ์ตามโรงเรียนได้",
        message_en: message,
      }),
      { status: 500 },
    );
  }
}
