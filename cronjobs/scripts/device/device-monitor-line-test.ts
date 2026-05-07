/**
 * TEST SCRIPT — ทดสอบส่งรายงานสถานะเครื่องเฉพาะโรงเรียนทดสอบ (school_id=849, GroupType=test)
 * ใช้สำหรับ verify ก่อน deploy จริง — ไม่ส่งไปโรงเรียนจริง
 * เช็กสถานะ Bot ก่อนทำงานเสมอ เช่นเดียวกับ production script
 *
 * Run: bun run cronjobs/scripts/device/device-monitor-line-test.ts
 */

import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { PrismaJabjaiMaster } from "@/helpers/prisma/prisma-jabjai-master-single-db";

const APP_URL = process.env.APP_INTERNAL_URL ?? "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET ?? "";

// school_id ทดสอบ (GroupType=test, GroupId=Cf98092bd75efb8c297ae0132ea663afb)
const TEST_SCHOOL_ID = 849;

const SEP = "─".repeat(70);

// ✨ เช็กสถานะเปิด/ปิด Bot จาก Timesheet DB — คืน true ถ้าเปิดใช้งาน
async function isBotEnabled(): Promise<{
  enabled: boolean;
  updatedBy: number | null;
  updatedAt: Date | null;
}> {
  try {
    const row = await PrismaTimesheet.botSetting.findUnique({
      where: { key: "line_bot_enabled" },
      select: { value: true, updated_by: true, updated_at: true },
    });
    if (!row) return { enabled: true, updatedBy: null, updatedAt: null };
    return {
      enabled: row.value === "true",
      updatedBy: row.updated_by,
      updatedAt: row.updated_at,
    };
  } catch (err) {
    console.error(
      `[BOT-SETTING] ไม่สามารถดึงสถานะ Bot ได้ — ใช้ค่า default: เปิด`,
      err,
    );
    return { enabled: true, updatedBy: null, updatedAt: null };
  }
}

async function main() {
  const timestamp = new Date().toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
  });

  console.log(`\n${SEP}`);
  console.log(`[${timestamp}] === TEST SCRIPT — Device Monitor LINE Bot ===`);
  console.log(`[${timestamp}] School ID    : ${TEST_SCHOOL_ID} (test school)`);
  console.log(`[${timestamp}] APP_URL      : ${APP_URL}`);
  console.log(
    `[${timestamp}] CRON_SECRET  : ${CRON_SECRET ? "SET" : "NOT SET ⚠"}`,
  );
  console.log(SEP);

  // ─── [1] ตรวจสอบ Bot Status ───
  console.log(`[${timestamp}] [1/4] ตรวจสอบสถานะ LINE Bot...`);
  const { enabled: botEnabled, updatedBy, updatedAt } = await isBotEnabled();

  console.log(
    `[${timestamp}]       Bot Status : ${
      botEnabled ? "✓ เปิดใช้งาน" : "✗ ปิดใช้งาน"
    }`,
  );
  if (updatedAt) {
    console.log(
      `[${timestamp}]       Updated At : ${updatedAt.toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
      })}`,
    );
  }
  if (updatedBy) {
    console.log(`[${timestamp}]       Updated By : user_id=${updatedBy}`);
  }

  if (!botEnabled) {
    console.log(`\n${SEP}`);
    console.log(`[${timestamp}] ✗ LINE Bot ถูกปิดใช้งาน — หยุดทดสอบ`);
    console.log(`[${timestamp}]   → ไม่ส่งแจ้งเตือนแม้ในโหมดทดสอบ`);
    console.log(
      `[${timestamp}]   → เปิดใช้งานได้ที่: ตรวจสอบสถานะอุปกรณ์ → ปุ่มตั้งค่า → เปิด LINE Bot`,
    );
    console.log(SEP);
    await PrismaTimesheet.$disconnect();
    await PrismaJabjaiMaster.$disconnect();
    process.exit(0);
  }

  // ─── [2] ดึง Notify Config ของโรงเรียนทดสอบจาก DB ───
  console.log(
    `\n[${timestamp}] [2/4] ดึงการตั้งค่าการแจ้งเตือนของโรงเรียน ${TEST_SCHOOL_ID} จาก DB...`,
  );
  let intervalRound1 = 5;
  let intervalRound2 = 30;
  let timeWindowsLabel = "ใช้ค่า default (06:00–08:00, 15:00–17:00)";

  try {
    const [dbWindows, dbIntervals] = await Promise.all([
      PrismaJabjaiMaster.deviceNotifyTimeWindow.findMany({
        where: { school_id: TEST_SCHOOL_ID },
        orderBy: { round: "asc" },
      }),
      PrismaJabjaiMaster.deviceNotifyInterval.findMany({
        where: { school_id: TEST_SCHOOL_ID },
        orderBy: { round: "asc" },
      }),
    ]);

    if (dbWindows.length > 0) {
      timeWindowsLabel = dbWindows
        .map(
          (w) =>
            `รอบ${w.round}: ${String(w.start_hour).padStart(2, "0")}:${String(
              w.start_min,
            ).padStart(2, "0")}–` +
            `${String(w.end_hour).padStart(2, "0")}:${String(
              w.end_min,
            ).padStart(2, "0")}` +
            ` (${w.label})${w.is_active ? "" : " [ปิด]"}`,
        )
        .join(", ");
    }
    if (dbIntervals.length > 0) {
      intervalRound1 =
        dbIntervals.find((v) => v.round === 1 && v.is_active)
          ?.interval_minutes ?? 5;
      intervalRound2 =
        dbIntervals.find((v) => v.round === 2 && v.is_active)
          ?.interval_minutes ?? 30;
    }

    const source =
      dbWindows.length > 0 ? "จาก DB" : "ค่า default (ยังไม่มีข้อมูลใน DB)";
    console.log(`[${timestamp}]       แหล่งข้อมูล  : ${source}`);
    console.log(`[${timestamp}]       ช่วงเวลา     : ${timeWindowsLabel}`);
    console.log(
      `[${timestamp}]       ช่วงห่าง     : รอบแรก ${intervalRound1} นาที, รอบถัดไป ${intervalRound2} นาที`,
    );
    console.log(
      `[${timestamp}]       หมายเหตุ     : TEST MODE ข้ามการตรวจสอบช่วงเวลา (ส่งทันที)`,
    );
  } catch (err) {
    console.error(
      `[${timestamp}]       ⚠ ดึงจาก DB ไม่ได้ — ใช้ค่า default`,
      err,
    );
  }

  // ─── [3] เรียก API ───
  console.log(`\n[${timestamp}] [3/4] เรียก Cronjob API...`);
  try {
    const query = new URLSearchParams({
      interval_round1: String(intervalRound1),
      interval_round2: String(intervalRound2),
    });
    const url = `${APP_URL}/api/v2/hardware/school-device/cronjob/${TEST_SCHOOL_ID}?${query.toString()}`;
    console.log(`[${timestamp}]       URL          : GET ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      signal: AbortSignal.timeout(30_000),
    });

    const body = await response.json();

    console.log(`[${timestamp}]       HTTP Status  : ${response.status}`);

    if (!response.ok) {
      console.error(`[${timestamp}] ✗ API ตอบกลับ error`);
      console.error(
        `[${timestamp}]   Response:`,
        JSON.stringify(body, null, 2),
      );
      await PrismaTimesheet.$disconnect();
      await PrismaJabjaiMaster.$disconnect();
      process.exit(1);
    }

    // ─── [4] แสดงผลลัพธ์ ───
    const data = body?.data;
    const lineSkipped = data?.line?.skipped === true;
    const lineSuccess = data?.line?.success === true;

    console.log(`\n[${timestamp}] [4/4] ผลลัพธ์`);
    console.log(`${SEP}`);
    console.log(
      `[${timestamp}] โรงเรียน     : ${data?.school_name ?? "-"} (ID: ${
        data?.school_id ?? "-"
      })`,
    );
    console.log(
      `[${timestamp}] อุปกรณ์      : ทั้งหมด ${data?.total ?? 0} เครื่อง`,
    );
    console.log(
      `[${timestamp}]               ออนไลน์  ${data?.online ?? 0} เครื่อง`,
    );
    console.log(
      `[${timestamp}]               ออฟไลน์  ${data?.offline ?? 0} เครื่อง`,
    );

    if (lineSkipped) {
      console.log(
        `[${timestamp}] LINE         : ⏭ SKIPPED — ไม่มีเครื่องออฟไลน์ถึงเกณฑ์การแจ้งเตือน`,
      );
      console.log(
        `[${timestamp}]               (ออฟไลน์ < ${intervalRound1} นาที หรือไม่ตรง cycle ${intervalRound2} นาที)`,
      );
    } else if (lineSuccess) {
      const round = data?.line?.notify_round as 1 | 2 | null | undefined;
      const roundLabel = round === 1
        ? `รอบแรก (offline ${intervalRound1}–${intervalRound2} นาที)`
        : round === 2
          ? `รอบถัดไป (offline ≥ ${intervalRound2} นาที, ตรง cycle)`
          : "-";
      console.log(`[${timestamp}] LINE         : ✓ SUCCESS — ส่งแจ้งเตือนสำเร็จ`);
      console.log(`[${timestamp}]               group_id=${data?.line?.group_id ?? "-"}`);
      console.log(`[${timestamp}]               การแจ้งเตือน: ${roundLabel}`);
    } else {
      console.log(`[${timestamp}] LINE         : ✗ FAILED — ส่งไม่สำเร็จ`);
      console.log(
        `[${timestamp}]               group_id=${data?.line?.group_id ?? "-"}`,
      );
      if (data?.line?.error) {
        console.error(`[${timestamp}]               error: ${data.line.error}`);
      }
    }

    // แสดงรายการอุปกรณ์ที่ออฟไลน์ พร้อมสถานะ threshold
    const allDevices = data?.devices ?? [];
    const offlineDevices = allDevices.filter((d: { is_online: boolean }) => !d.is_online);
    if (offlineDevices.length > 0) {
      console.log(`\n[${timestamp}] รายการเครื่องออฟไลน์ (${offlineDevices.length} เครื่อง):`);
      console.log(`[${timestamp}]   เกณฑ์: รอบแรก ${intervalRound1}–${intervalRound2} นาที | รอบถัดไป ≥${intervalRound2} นาที ตรง cycle`);
      const now = Date.now();
      for (const d of offlineDevices) {
        const name: string = d.app_name ?? d.device_id ?? "unknown";
        const deviceId: string = d.device_id ?? "";
        const notifyEnabled: boolean = d.notify_enabled ?? false;
        const onlineTime: string | null = d.online_time ?? null;

        if (!notifyEnabled) {
          console.log(`[${timestamp}]   [ปิด]  ${deviceId.padEnd(25)} ${name.padEnd(20)} แจ้งเตือน=ปิด`);
          continue;
        }
        if (!onlineTime) {
          console.log(`[${timestamp}]   [?]    ${deviceId.padEnd(25)} ${name.padEnd(20)} ไม่รู้เวลาออฟไลน์`);
          continue;
        }

        const offlineMin = (now - new Date(onlineTime).getTime()) / 60_000;
        const offlineMinStr = offlineMin.toFixed(1);

        if (offlineMin >= intervalRound1 && offlineMin < intervalRound2) {
          console.log(`[${timestamp}]   [R1✓] ${deviceId.padEnd(25)} ${name.padEnd(20)} offline ${offlineMinStr} นาที → แจ้งเตือน รอบแรก`);
        } else if (offlineMin >= intervalRound2 && offlineMin % intervalRound2 < 1) {
          const cycleNo = Math.floor(offlineMin / intervalRound2);
          console.log(`[${timestamp}]   [R2✓] ${deviceId.padEnd(25)} ${name.padEnd(20)} offline ${offlineMinStr} นาที → แจ้งเตือน รอบถัดไป (cycle ที่ ${cycleNo})`);
        } else if (offlineMin < intervalRound1) {
          console.log(`[${timestamp}]   [--]  ${deviceId.padEnd(25)} ${name.padEnd(20)} offline ${offlineMinStr} นาที (รอ ${(intervalRound1 - offlineMin).toFixed(1)} นาที)`);
        } else {
          const nextCycle = Math.ceil(offlineMin / intervalRound2) * intervalRound2;
          console.log(`[${timestamp}]   [--]  ${deviceId.padEnd(25)} ${name.padEnd(20)} offline ${offlineMinStr} นาที (รอ cycle ที่ ${nextCycle.toFixed(0)} นาที)`);
        }
      }
    }

    console.log(`\n[${timestamp}] ✓ TEST สำเร็จ`);
    console.log(SEP);

    await PrismaTimesheet.$disconnect();
    await PrismaJabjaiMaster.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`[${timestamp}] ✗ ERROR:`, error);
    await PrismaTimesheet.$disconnect();
    await PrismaJabjaiMaster.$disconnect();
    process.exit(1);
  }
}

main();
