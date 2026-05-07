/**
 * CronJob Script — ตรวจสอบสถานะ Hardware และส่งแจ้งเตือนผ่าน LINE
 * รันโดย Kubernetes CronJob ทุก 1 นาที (Asia/Bangkok)
 * Time Condition: อ่านจาก DB (DeviceNotifyTimeWindow) — ไม่ hardcode
 * Interval Condition: อ่านจาก DB (DeviceNotifyInterval) — ไม่ hardcode
 * Bot Condition: เช็กจาก bot_setting.line_bot_enabled ใน Timesheet DB ก่อนทำงานทุกครั้ง
 */

import { PrismaJabjaiMaster } from "@/helpers/prisma/prisma-jabjai-master-single-db";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

const APP_URL =
  process.env.APP_INTERNAL_URL ?? "http://sb-helper.schoolbright.co";
const CRON_SECRET = process.env.CRON_SECRET ?? "";

// TEST_SCHOOL_ID=849 จะ bypass quiet hours และส่งเฉพาะโรงเรียนนั้น (ใช้ทดสอบ local)
const TEST_SCHOOL_ID = process.env.TEST_SCHOOL_ID
  ? parseInt(process.env.TEST_SCHOOL_ID, 10)
  : null;

const SEP = "─".repeat(70);

// ✨ เช็กสถานะเปิด/ปิด Bot จาก Timesheet DB — คืน true ถ้าเปิดใช้งาน
async function isBotEnabled(): Promise<boolean> {
  try {
    const row = await PrismaTimesheet.botSetting.findUnique({
      where: { key: "line_bot_enabled" },
      select: { value: true, updated_by: true, updated_at: true },
    });
    if (!row) {
      // ยังไม่มี row → ถือว่าเปิดอยู่ (default)
      return true;
    }
    return row.value === "true";
  } catch (err) {
    // ถ้า query ล้มเหลว → ให้ทำงานต่อ (fail-open) ไม่ให้ DB error ระงับ Bot
    console.error(`[BOT-SETTING] ไม่สามารถดึงสถานะ Bot ได้ — ใช้ค่า default: เปิด`, err);
    return true;
  }
}

interface TimeWindow {
  round: number;
  label: string;
  start_hour: number;
  start_min: number;
  end_hour: number;
  end_min: number;
  is_active: boolean;
}

interface NotifyInterval {
  round: number;
  label: string;
  interval_minutes: number;
  is_active: boolean;
}

// ✨ ดึงช่วงเวลาแจ้งเตือนและช่วงห่างจาก DB — คืน null ถ้าดึงไม่ได้
async function fetchNotifyConfig(): Promise<{
  timeWindows: TimeWindow[];
  intervals: NotifyInterval[];
} | null> {
  try {
    const [timeWindows, intervals] = await Promise.all([
      PrismaJabjaiMaster.deviceNotifyTimeWindow.findMany({
        orderBy: { round: "asc" },
      }),
      PrismaJabjaiMaster.deviceNotifyInterval.findMany({
        orderBy: { round: "asc" },
      }),
    ]);
    return { timeWindows, intervals };
  } catch (err) {
    console.error(`[NOTIFY-CONFIG] ไม่สามารถดึงการตั้งค่าการแจ้งเตือนจาก DB ได้`, err);
    return null;
  }
}

// ✨ ตรวจสอบว่าเวลาปัจจุบัน (Bangkok) อยู่ในช่วงเวลาที่อนุญาตให้แจ้งเตือนหรือไม่
function isWithinNotifyWindow(timeWindows: TimeWindow[]): boolean {
  const now = new Date();
  const bangkokTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
  );
  const currentHour = bangkokTime.getHours();
  const currentMin = bangkokTime.getMinutes();
  const currentTotalMin = currentHour * 60 + currentMin;

  for (const w of timeWindows) {
    if (!w.is_active) continue;
    const startTotalMin = w.start_hour * 60 + w.start_min;
    const endTotalMin = w.end_hour * 60 + w.end_min;
    if (currentTotalMin >= startTotalMin && currentTotalMin < endTotalMin) {
      return true;
    }
  }
  return false;
}

// ✨ ดึงรายชื่อ LINE Group ทั้งหมดจาก tLineGroup และแสดงผลในรูปแบบตาราง
async function fetchAndDisplayLineGroups() {
  const groups = await PrismaJabjaiMaster.tLineGroup.findMany({
    orderBy: { SchoolId: "asc" },
    select: {
      LineGroupId: true,
      SchoolId: true,
      GroupId: true,
      GroupType: true,
      CreateDate: true,
    },
  });

  console.log(`\n${SEP}`);
  console.log(` LINE Groups ที่พบทั้งหมด: ${groups.length} กลุ่ม`);
  console.log(SEP);
  console.log(
    ` ${"#".padEnd(5)} ${"LineGroupId".padEnd(12)} ${"SchoolId".padEnd(10)} ${"GroupType".padEnd(15)} ${"GroupId".padEnd(35)} ${"CreateDate"}`,
  );
  console.log(SEP);

  groups.forEach((g, i) => {
    const date = g.CreateDate
      ? new Date(g.CreateDate).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })
      : "-";
    console.log(
      ` ${String(i + 1).padEnd(5)} ${String(g.LineGroupId).padEnd(12)} ${String(g.SchoolId ?? "-").padEnd(10)} ${(g.GroupType ?? "-").padEnd(15)} ${(g.GroupId ?? "-").padEnd(35)} ${date}`,
    );
  });

  console.log(`${SEP}\n`);
  return groups;
}

// ✨ ส่งรายงานสถานะเครื่องของโรงเรียนเดียวไปยัง LINE Group พร้อมส่ง interval สำหรับ threshold check
async function sendSchoolReport(
  schoolId: number,
  timestamp: string,
  intervalRound1: number,
  intervalRound2: number,
): Promise<boolean> {
  try {
    const query = new URLSearchParams({
      interval_round1: String(intervalRound1),
      interval_round2: String(intervalRound2),
    });
    const response = await fetch(
      `${APP_URL}/api/v2/hardware/school-device/cronjob/${schoolId}?${query.toString()}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
        signal: AbortSignal.timeout(30_000),
      },
    );

    console.log(`[${timestamp}] School ${schoolId} — HTTP ${response.status}`);
    return response.ok;
  } catch (error) {
    console.error(`[${timestamp}] School ${schoolId} — ERROR:`, error);
    return false;
  }
}

// ✨ ฟังก์ชันหลัก — เช็กสถานะ Bot, ช่วงเวลา, แล้วส่งรายงานทีละโรงเรียน
async function main() {
  const timestamp = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
  console.log(`\n${SEP}`);
  console.log(`[${timestamp}] Device Monitor LINE Bot — Starting`);
  console.log(SEP);

  // ─── ตรวจสอบ Bot Status (ระดับสูงสุด) ───
  const botEnabled = await isBotEnabled();
  if (!botEnabled) {
    console.log(`\n${SEP}`);
    console.log(`[${timestamp}] ⚠ มีการปิดการใช้งาน LINE Bot ในระบบ`);
    console.log(`[${timestamp}]   → ระบบจะไม่ทำการ Query ข้อมูลอุปกรณ์`);
    console.log(`[${timestamp}]   → ระบบจะไม่ส่งการแจ้งเตือนไปยัง LINE`);
    console.log(`[${timestamp}]   → หากต้องการเปิดใช้งาน กรุณาไปที่หน้า Web Admin`);
    console.log(`[${timestamp}]   → เส้นทาง: ตรวจสอบสถานะอุปกรณ์ → ปุ่มตั้งค่า → เปิด LINE Bot`);
    console.log(SEP);
    await PrismaTimesheet.$disconnect();
    process.exit(0);
  }
  console.log(`[${timestamp}] ✓ Bot Status: เปิดใช้งาน`);

  // ─── ดึงการตั้งค่าช่วงเวลาและช่วงห่างจาก DB ───
  const notifyConfig = await fetchNotifyConfig();
  if (!notifyConfig) {
    console.log(`[${timestamp}] ⚠ ไม่สามารถดึงการตั้งค่าการแจ้งเตือนได้ — หยุดทำงาน`);
    await PrismaTimesheet.$disconnect();
    await PrismaJabjaiMaster.$disconnect();
    process.exit(1);
  }

  const { timeWindows, intervals } = notifyConfig;
  const activeWindows = timeWindows.filter((w) => w.is_active);
  const windowLabels = activeWindows
    .map((w) => `${String(w.start_hour).padStart(2, "0")}:${String(w.start_min).padStart(2, "0")}–${String(w.end_hour).padStart(2, "0")}:${String(w.end_min).padStart(2, "0")} (${w.label})`)
    .join(", ");

  const intervalRound1 = intervals.find((v) => v.round === 1 && v.is_active)?.interval_minutes ?? 5;
  const intervalRound2 = intervals.find((v) => v.round === 2 && v.is_active)?.interval_minutes ?? 30;

  console.log(`[${timestamp}] ✓ ช่วงเวลาแจ้งเตือน: ${windowLabels || "ไม่มีรอบที่เปิดใช้งาน"}`);
  console.log(`[${timestamp}] ✓ ช่วงห่าง: รอบแรก ${intervalRound1} นาที, รอบถัดไป ${intervalRound2} นาที`);

  // โหมดทดสอบ — ส่งเฉพาะโรงเรียนที่ระบุ และข้ามการตรวจสอบช่วงเวลา
  if (TEST_SCHOOL_ID !== null) {
    console.log(`[${timestamp}] TEST MODE — school_id=${TEST_SCHOOL_ID}, APP_URL=${APP_URL}`);
    const ok = await sendSchoolReport(TEST_SCHOOL_ID, timestamp, intervalRound1, intervalRound2);
    await PrismaTimesheet.$disconnect();
    await PrismaJabjaiMaster.$disconnect();
    process.exit(ok ? 0 : 1);
  }

  // ─── ตรวจสอบช่วงเวลาแจ้งเตือน ───
  if (activeWindows.length === 0) {
    console.log(`[${timestamp}] ไม่มีช่วงเวลาแจ้งเตือนที่เปิดใช้งาน — skipping`);
    await PrismaTimesheet.$disconnect();
    await PrismaJabjaiMaster.$disconnect();
    process.exit(0);
  }

  if (!isWithinNotifyWindow(activeWindows)) {
    console.log(`[${timestamp}] อยู่นอกช่วงเวลาแจ้งเตือน (${windowLabels}) — skipping`);
    await PrismaTimesheet.$disconnect();
    await PrismaJabjaiMaster.$disconnect();
    process.exit(0);
  }

  console.log(`[${timestamp}] ✓ อยู่ในช่วงเวลาแจ้งเตือน — เริ่มส่งรายงาน`);

  // ─── ดึง LINE Groups และส่งรายงาน ───
  const groups = await fetchAndDisplayLineGroups();

  if (groups.length === 0) {
    console.log(`[${timestamp}] ไม่พบ LINE Group ในระบบ — skipping`);
    await PrismaTimesheet.$disconnect();
    await PrismaJabjaiMaster.$disconnect();
    process.exit(0);
  }

  const activeGroups = groups.filter(
    (g) => g.SchoolId !== null && g.GroupId !== null && g.GroupId.trim() !== "",
  );

  console.log(`[${timestamp}] Active groups with valid SchoolId+GroupId: ${activeGroups.length}`);

  let successCount = 0;
  let failCount = 0;

  for (const group of activeGroups) {
    const schoolId = group.SchoolId!;
    const ok = await sendSchoolReport(schoolId, timestamp, intervalRound1, intervalRound2);
    if (ok) successCount++;
    else failCount++;
  }

  console.log(`\n${SEP}`);
  console.log(`[${timestamp}] Done — success: ${successCount}, failed: ${failCount}`);
  console.log(SEP);

  await PrismaTimesheet.$disconnect();
  await PrismaJabjaiMaster.$disconnect();

  if (failCount > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main();
