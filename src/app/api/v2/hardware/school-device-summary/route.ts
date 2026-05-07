import { errorResponse, successResponse } from "@/helpers/api/response";
import { PrismaJabjaiMaster } from "@/helpers/prisma/prisma-jabjai-master-single-db";
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
    notify_round: 1 | 2 | null;
  }[];
}

// คำนวณรอบการแจ้งเตือน (1 หรือ 2) จากเวลา offline และ config ช่วงห่าง (server-side)
function computeDeviceNotifyRound(
  onlineTime: Date | null,
  nowMs: number,
  round1Minutes: number,
  round2Minutes: number,
): 1 | 2 | null {
  if (!onlineTime) return null;
  const offlineMin = (nowMs - onlineTime.getTime()) / 60_000;
  if (offlineMin < round1Minutes) return null;
  if (round2Minutes <= 0 || offlineMin < round1Minutes + round2Minutes)
    return 1;
  return 2;
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
    const nowMs = now.getTime();

    const [allDevices, allSchools, hardwareServerOk, allIntervals] =
      await Promise.all([
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
            NotifyEnabled: true,
          },
          orderBy: [
            { SchoolID: "asc" },
            { AppName: "asc" },
            { DeviceID: "asc" },
          ],
        }),
        prisma.activeSchoolList.findMany({
          select: { nCompany: true, sCompany: true },
        }),
        checkHardwareServerHealth(),
        // ดึง interval config ทุกโรงเรียนจาก jabjai-master เพื่อคำนวณ notify_round ฝั่ง server
        PrismaJabjaiMaster.deviceNotifyInterval.findMany({
          where: { is_active: true },
          select: { school_id: true, round: true, interval_minutes: true },
        }),
      ]);

    // สร้าง Map school_id → { round1Minutes, round2Minutes } (default: 5 / 30 นาที)
    type IntervalConfig = { round1Minutes: number; round2Minutes: number };
    const intervalMap = new Map<number, IntervalConfig>();
    for (const iv of allIntervals) {
      const entry = intervalMap.get(iv.school_id) ?? {
        round1Minutes: 5,
        round2Minutes: 30,
      };
      if (iv.round === 1) entry.round1Minutes = iv.interval_minutes;
      else if (iv.round === 2) entry.round2Minutes = iv.interval_minutes;
      intervalMap.set(iv.school_id, entry);
    }

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

      // คำนวณรอบการแจ้งเตือนฝั่ง server จาก online_time และ interval config ของโรงเรียน
      const intervalConfig = intervalMap.get(device.SchoolID) ?? {
        round1Minutes: 5,
        round2Minutes: 30,
      };
      const notifyRound = isOnline
        ? null
        : computeDeviceNotifyRound(
            device.OnlineTime ? new Date(device.OnlineTime) : null,
            nowMs,
            intervalConfig.round1Minutes,
            intervalConfig.round2Minutes,
          );

      entry.devices.push({
        device_id: device.DeviceID,
        app_name: device.AppName ?? "ไม่ระบุแอป",
        app_version: device.AppVersion ?? "-",
        note: device.Note ?? null,
        is_online: isOnline,
        is_login: device.Login,
        online_time: device.OnlineTime?.toISOString() ?? null,
        offline_reason: isOnline ? null : offlineReason,
        notify_enabled: device.NotifyEnabled,
        notify_round: notifyRound,
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
      const diff =
        sortBy === "school_name"
          ? a.school_name.localeCompare(b.school_name, "th")
          : sortBy === "online"
          ? a.online - b.online
          : sortBy === "total"
          ? a.total - b.total
          : a.offline - b.offline;
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
