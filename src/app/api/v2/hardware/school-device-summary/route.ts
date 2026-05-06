import { errorResponse, successResponse } from "@/helpers/api/response";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { API_URL } from "@/services/api-url";
import prisma from "@helpers/prisma";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const TEN_MIN_IN_MS = 10 * 60 * 1000;

export interface SchoolDeviceSummaryItem {
  school_id: number;
  school_name: string;
  online: number;
  offline: number;
  total: number;
  offline_reason: "server_down" | "device_or_network" | null;
  devices: {
    device_id: string;
    app_name: string;
    app_version: string;
    note: string | null;
    is_online: boolean;
    is_login: boolean;
    online_time: string | null;
    offline_reason: "server_down" | "device_or_network" | null;
    notify_enabled: boolean;
  }[];
}

// ตรวจสอบสถานะ hardware server โดยยิง GET /api/application แล้วคืน true ถ้าได้ 200
async function checkHardwareServerHealth(): Promise<boolean> {
  try {
    const res = await axios.get(
      `${API_URL.PROD_HARDWARE_API_URL}/api/application`,
      { timeout: 8000, validateStatus: () => true },
    );
    return res.status === 200;
  } catch {
    return false;
  }
}

// GET handler — ดึงสรุปสถานะอุปกรณ์จัดกลุ่มตามโรงเรียน พร้อม filter/sort จาก query params
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
    const statusFilter = searchParams.get("status_filter") ?? "all"; // all | has_offline | all_online
    const sortBy = searchParams.get("sort_by") ?? "offline"; // offline | online | total | school_name
    const sortOrder = searchParams.get("sort_order") ?? "desc"; // asc | desc

    const now = new Date();

    const [allDevices, allSchools, hardwareServerOk] = await Promise.all([
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
      checkHardwareServerHealth(),
    ]);

    // ดึง notify setting ทั้งหมดจาก timesheet DB แล้วสร้าง Map สำหรับ lookup
    const schoolIds = [...new Set(allDevices.map((d) => d.SchoolID))];
    const notifySettings = await PrismaTimesheet.deviceMonitorSetting.findMany({
      where: { school_id: { in: schoolIds } },
      select: { school_id: true, device_id: true, notify_enabled: true },
    });
    const notifyMap = new Map<string, boolean>(
      notifySettings.map((s) => [`${s.school_id}:${s.device_id}`, s.notify_enabled]),
    );

    // สาเหตุ offline ระดับโรงเรียน/เครื่อง ขึ้นอยู่กับสถานะ server
    const offlineReason: "server_down" | "device_or_network" = hardwareServerOk
      ? "device_or_network"
      : "server_down";

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
      const isOnline = onlineTime
        ? now.getTime() - onlineTime.getTime() <= TEN_MIN_IN_MS
        : false;

      if (!schoolMap.has(device.SchoolID)) {
        schoolMap.set(device.SchoolID, {
          school_id: device.SchoolID,
          school_name:
            schoolNameMap.get(device.SchoolID) ?? `โรงเรียน ${device.SchoolID}`,
          online: 0,
          offline: 0,
          total: 0,
          offline_reason: null,
          devices: [],
        });
      }

      const entry = schoolMap.get(device.SchoolID)!;
      entry.total++;
      if (isOnline) {
        entry.online++;
      } else {
        entry.offline++;
        entry.offline_reason = offlineReason;
      }

      entry.devices.push({
        device_id: device.DeviceID,
        app_name: device.AppName ?? "ไม่ระบุแอป",
        app_version: device.AppVersion ?? "-",
        note: device.Note ?? null,
        is_online: isOnline,
        is_login: device.Login,
        online_time: device.OnlineTime?.toISOString() ?? null,
        offline_reason: isOnline ? null : offlineReason,
        notify_enabled: notifyMap.get(`${device.SchoolID}:${device.DeviceID}`) ?? true,
      });
    }

    let data = Array.from(schoolMap.values());

    // กรองตาม search (ชื่อโรงเรียน หรือ school_id)
    if (search) {
      data = data.filter(
        (s) =>
          s.school_name.toLowerCase().includes(search) ||
          String(s.school_id).includes(search),
      );
    }

    // กรองตาม status
    if (statusFilter === "has_offline") {
      data = data.filter((s) => s.offline > 0);
    } else if (statusFilter === "all_online") {
      data = data.filter((s) => s.offline === 0);
    }

    // เรียงลำดับตาม sort_by / sort_order
    data.sort((a, b) => {
      let diff = 0;
      if (sortBy === "school_name") {
        diff = a.school_name.localeCompare(b.school_name, "th");
      } else if (sortBy === "online") {
        diff = a.online - b.online;
      } else if (sortBy === "total") {
        diff = a.total - b.total;
      } else {
        // default: offline
        diff = a.offline - b.offline;
      }
      return sortOrder === "asc" ? diff : -diff;
    });

    return NextResponse.json(
      successResponse({
        data: {
          items: data,
          total: data.length,
          hardware_server_ok: hardwareServerOk,
        },
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
