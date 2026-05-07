import { errorResponse, successResponse } from "@/helpers/api/response";
import { handleError } from "@/helpers/controller/handle-error.params";
import { PrismaJabjaiMaster } from "@/helpers/prisma/prisma-jabjai-master-single-db";
import {
  buildSchoolDeviceReport,
  buildSchoolDeviceStatusData,
  linePushMessage,
} from "@services/line/line-push.service";
import { NextRequest, NextResponse } from "next/server";

// ✨ ตรวจสอบและอัปเดต state การแจ้งเตือนรายเครื่อง — คืนว่าควรส่ง LINE ไหม และรอบที่เท่าไหร่
async function checkAndUpdateNotifyState(
  schoolId: number,
  devices: Array<{ is_online: boolean; online_time: string | null; notify_enabled: boolean; device_id?: string; app_name?: string }>,
  intervalRound1Minutes: number,
  intervalRound2Minutes: number,
): Promise<{ result: boolean; notifyRound: 1 | 2 | null; debugLines: string[] }> {
  const now = new Date();
  const nowMs = now.getTime();
  const debugLines: string[] = [];
  let result = false;
  let notifyRound: 1 | 2 | null = null;

  // ดึง state ทุกเครื่องของโรงเรียนนี้ครั้งเดียว
  const existingStates = await PrismaJabjaiMaster.deviceNotifyState.findMany({
    where: { school_id: schoolId },
  });
  const stateMap = new Map(existingStates.map((s) => [s.device_id, s]));

  for (const device of devices) {
    const deviceId = device.device_id ?? "unknown";
    const name = device.app_name ?? deviceId;

    if (device.is_online) {
      // reset state เมื่อ online
      const existing = stateMap.get(deviceId);
      if (existing?.offline_since !== null) {
        await PrismaJabjaiMaster.deviceNotifyState.upsert({
          where: { school_id_device_id: { school_id: schoolId, device_id: deviceId } },
          create: { school_id: schoolId, device_id: deviceId, offline_since: null, r1_sent_at: null, last_notified_at: null },
          update: { offline_since: null, r1_sent_at: null, last_notified_at: null },
        });
      }
      continue;
    }

    if (!device.notify_enabled) {
      debugLines.push(`  [SKIP] ${name} — notify_enabled=false`);
      continue;
    }

    // เครื่อง offline + notify เปิด
    let state = stateMap.get(deviceId);

    // บันทึก offline_since ครั้งแรก
    if (!state || state.offline_since === null) {
      const offlineSince = device.online_time ? new Date(device.online_time) : now;
      const upserted = await PrismaJabjaiMaster.deviceNotifyState.upsert({
        where: { school_id_device_id: { school_id: schoolId, device_id: deviceId } },
        create: { school_id: schoolId, device_id: deviceId, offline_since: offlineSince, r1_sent_at: null, last_notified_at: null },
        update: { offline_since: offlineSince },
      });
      state = upserted;
      stateMap.set(deviceId, upserted);
    }

    const offlineSinceMs = state.offline_since!.getTime();
    const offlineMin = (nowMs - offlineSinceMs) / 60_000;
    const offlineMinStr = offlineMin.toFixed(1);

    if (state.r1_sent_at === null) {
      // ยังไม่เคยส่ง R1
      if (offlineMin >= intervalRound1Minutes) {
        debugLines.push(`  [✓ R1] ${name} — offline ${offlineMinStr} นาที → แจ้งเตือนรอบแรก`);
        await PrismaJabjaiMaster.deviceNotifyState.update({
          where: { school_id_device_id: { school_id: schoolId, device_id: deviceId } },
          data: { r1_sent_at: now, last_notified_at: now },
        });
        result = true;
        if (notifyRound === null) notifyRound = 1;
      } else {
        debugLines.push(`  [--]  ${name} — offline ${offlineMinStr} นาที (รออีก ${(intervalRound1Minutes - offlineMin).toFixed(1)} นาทีถึงจะส่ง R1)`);
      }
    } else {
      // ส่ง R1 ไปแล้ว → ตรวจ R2 จาก last_notified_at
      const lastMs = state.last_notified_at!.getTime();
      const minutesSinceLast = (nowMs - lastMs) / 60_000;
      if (minutesSinceLast >= intervalRound2Minutes) {
        const cycleNo = Math.floor((nowMs - state.r1_sent_at!.getTime()) / 60_000 / intervalRound2Minutes);
        debugLines.push(`  [✓ R2] ${name} — offline ${offlineMinStr} นาที → แจ้งเตือนซ้ำ (ห่างจากครั้งล่าสุด ${minutesSinceLast.toFixed(1)} นาที, cycle ที่ ${cycleNo})`);
        await PrismaJabjaiMaster.deviceNotifyState.update({
          where: { school_id_device_id: { school_id: schoolId, device_id: deviceId } },
          data: { last_notified_at: now },
        });
        result = true;
        if (notifyRound === null) notifyRound = 2;
      } else {
        const waitMin = (intervalRound2Minutes - minutesSinceLast).toFixed(1);
        debugLines.push(`  [--]  ${name} — offline ${offlineMinStr} นาที (แจ้งเตือนครั้งถัดไปใน ~${waitMin} นาที)`);
      }
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
      const { result: shouldNotify, notifyRound: round, debugLines } = await checkAndUpdateNotifyState(
        schoolIdNum,
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
