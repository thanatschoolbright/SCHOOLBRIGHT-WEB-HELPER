import { errorResponse, successResponse } from "@/helpers/api/response";
import { handleError } from "@/helpers/controller/handle-error.params";
import { PrismaJabjaiMaster } from "@/helpers/prisma/prisma-jabjai-master-single-db";
import {
  buildSchoolDeviceReport,
  buildSchoolDeviceStatusData,
  linePushMessage,
} from "@services/line/line-push.service";
import { NextRequest, NextResponse } from "next/server";

// ✨ ตรวจสอบว่าเครื่องใดออฟไลน์นานถึงเกณฑ์แจ้งเตือน ตามช่วงห่างที่กำหนด — คืน debug log ด้วย
function hasDeviceReachingNotifyThreshold(
  devices: Array<{ is_online: boolean; online_time: string | null; notify_enabled: boolean; device_id?: string; app_name?: string }>,
  intervalRound1Minutes: number,
  intervalRound2Minutes: number,
): { result: boolean; notifyRound: 1 | 2 | null; debugLines: string[] } {
  const now = Date.now();
  const debugLines: string[] = [];
  let result = false;
  let notifyRound: 1 | 2 | null = null;

  for (const device of devices) {
    if (device.is_online) continue;

    const name = device.app_name ?? device.device_id ?? "unknown";

    if (!device.notify_enabled) {
      debugLines.push(`  [SKIP] ${name} — notify_enabled=false`);
      continue;
    }
    if (!device.online_time) {
      debugLines.push(`  [SKIP] ${name} — online_time=null (ไม่รู้เวลาออฟไลน์)`);
      continue;
    }

    const offlineMinutes = (now - new Date(device.online_time).getTime()) / 60_000;
    const offlineMin = offlineMinutes.toFixed(1);

    if (offlineMinutes >= intervalRound1Minutes && offlineMinutes < intervalRound2Minutes) {
      debugLines.push(`  [✓ R1] ${name} — offline ${offlineMin} นาที (เกณฑ์รอบแรก: ${intervalRound1Minutes}–${intervalRound2Minutes} นาที)`);
      result = true;
      if (notifyRound === null) notifyRound = 1;
    } else if (offlineMinutes >= intervalRound2Minutes && offlineMinutes % intervalRound2Minutes < 1) {
      debugLines.push(`  [✓ R2] ${name} — offline ${offlineMin} นาที (ตรง cycle ${intervalRound2Minutes} นาที)`);
      result = true;
      if (notifyRound === null) notifyRound = 2;
    } else if (offlineMinutes < intervalRound1Minutes) {
      debugLines.push(`  [--]   ${name} — offline ${offlineMin} นาที (ยังไม่ถึงเกณฑ์ ${intervalRound1Minutes} นาที)`);
    } else {
      const nextCycle = Math.ceil(offlineMinutes / intervalRound2Minutes) * intervalRound2Minutes;
      debugLines.push(`  [--]   ${name} — offline ${offlineMin} นาที (รอ cycle ถัดไปที่ ${nextCycle.toFixed(0)} นาที)`);
    }
  }

  return { result, notifyRound, debugLines };
}

// GET handler — ดึงสถานะเครื่องทุกเครื่องของโรงเรียน พร้อมส่งรายงานไปยัง LINE Group และคืน response รวม
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ school_id: string }> },
): Promise<NextResponse> {
  const { school_id } = await params;

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

  const schoolIdNum = parseInt(school_id, 10);
  if (isNaN(schoolIdNum) || schoolIdNum <= 0) {
    return NextResponse.json(
      errorResponse({
        status: 400,
        message_th: "รหัสโรงเรียนไม่ถูกต้อง กรุณาระบุตัวเลขที่มากกว่า 0",
        message_en: "Invalid school_id parameter",
      }),
      { status: 400 },
    );
  }

  const { searchParams } = new URL(request.url);

  // interval_round1 และ interval_round2 ส่งมาจาก cronjob หลังอ่านจาก DB
  const intervalRound1 = parseFloat(searchParams.get("interval_round1") ?? "0");
  const intervalRound2 = parseFloat(searchParams.get("interval_round2") ?? "0");
  const useIntervalCheck = intervalRound1 > 0 && intervalRound2 > 0;

  try {
    // ดึงข้อมูลสถานะเครื่องและ LINE group พร้อมกัน
    const [deviceData, schoolLineGroup] = await Promise.all([
      buildSchoolDeviceStatusData(schoolIdNum),
      PrismaJabjaiMaster.tLineGroup
        .findFirst({
          where: { SchoolId: schoolIdNum },
          orderBy: { CreateDate: "desc" },
        })
        .catch(() => null),
    ]);

    if (!deviceData) {
      return NextResponse.json(
        errorResponse({
          status: 404,
          message_th: `ไม่พบข้อมูลโรงเรียน รหัส ${schoolIdNum}`,
          message_en: `School ${schoolIdNum} not found`,
        }),
        { status: 404 },
      );
    }

    // ถ้า cronjob ส่ง interval มา → ตรวจว่ามีเครื่องถึงเกณฑ์แจ้งเตือนไหม
    let notifyRound: 1 | 2 | null = null;
    if (useIntervalCheck) {
      const { result: shouldNotify, notifyRound: round, debugLines } = hasDeviceReachingNotifyThreshold(
        deviceData.devices,
        intervalRound1,
        intervalRound2,
      );
      notifyRound = round;
      console.log(`[THRESHOLD] school=${schoolIdNum} interval=[${intervalRound1},${intervalRound2}] offline=${deviceData.devices.filter((d) => !d.is_online).length} เครื่อง`);
      for (const line of debugLines) console.log(`[THRESHOLD]${line}`);
      console.log(`[THRESHOLD] → shouldNotify=${shouldNotify} notifyRound=${notifyRound}`);
      if (!shouldNotify) {
        return NextResponse.json(
          successResponse({
            message_th: `ไม่มีอุปกรณ์ที่ถึงเกณฑ์การแจ้งเตือน โรงเรียน ${deviceData.school_name}`,
            message_en: "No devices reached notification threshold — skipped",
            data: { ...deviceData, line: { success: false, group_id: null, skipped: true, notify_round: null } },
          }),
          { status: 200 },
        );
      }
    }

    // ส่ง LINE notification ถ้ามี group ที่กำหนด
    const groupId =
      schoolLineGroup?.GroupId ??
      searchParams.get("group_id") ??
      process.env.LINE_MONITORING_GROUP_ID ??
      null;

    let lineResult: { success: boolean; group_id: string | null; skipped?: boolean; notify_round?: 1 | 2 | null; error?: string } = {
      success: false,
      group_id: null,
    };

    if (groupId) {
      try {
        const { messages } = await buildSchoolDeviceReport(schoolIdNum);
        await linePushMessage(groupId, messages);
        lineResult = { success: true, group_id: groupId, notify_round: notifyRound };
      } catch (lineErr: unknown) {
        lineResult = {
          success: false,
          group_id: groupId,
          error: lineErr instanceof Error ? lineErr.message : "LINE push failed",
        };
      }
    }

    return NextResponse.json(
      successResponse({
        message_th: `ดึงข้อมูลสถานะเครื่องของ ${deviceData.school_name} สำเร็จ`,
        message_en: "School device status retrieved successfully",
        data: {
          ...deviceData,
          line: lineResult,
        },
      }),
      { status: 200 },
    );
  } catch (err: unknown) {
    return handleError(err, "GET /api/v2/hardware/school-device/cronjob/[school_id]");
  }
}
