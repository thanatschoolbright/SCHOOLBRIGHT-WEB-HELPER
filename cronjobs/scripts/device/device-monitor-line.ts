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

const DEFAULT_TIME_WINDOWS: TimeWindow[] = [
  { round: 1, label: "รอบเช้า", start_hour: 6, start_min: 0, end_hour: 8, end_min: 0, is_active: true },
  { round: 2, label: "รอบบ่าย", start_hour: 15, start_min: 0, end_hour: 17, end_min: 0, is_active: true },
];
const DEFAULT_INTERVALS: NotifyInterval[] = [
  { round: 1, label: "รอบแรก", interval_minutes: 5, is_active: true },
  { round: 2, label: "รอบถัดไป", interval_minutes: 30, is_active: true },
];

// ✨ ดึงการตั้งค่าของทุกโรงเรียนจาก DB ครั้งเดียว แล้วจัดกลุ่มตาม school_id
async function fetchAllSchoolConfigs(): Promise<{
  windowsBySchool: Map<number, TimeWindow[]>;
  intervalsBySchool: Map<number, NotifyInterval[]>;
} | null> {
  try {
    const [allWindows, allIntervals] = await Promise.all([
      PrismaJabjaiMaster.deviceNotifyTimeWindow.findMany({ orderBy: { round: "asc" } }),
      PrismaJabjaiMaster.deviceNotifyInterval.findMany({ orderBy: { round: "asc" } }),
    ]);
    const windowsBySchool = new Map<number, TimeWindow[]>();
    for (const w of allWindows) {
      const list = windowsBySchool.get(w.school_id) ?? [];
      list.push(w);
      windowsBySchool.set(w.school_id, list);
    }
    const intervalsBySchool = new Map<number, NotifyInterval[]>();
    for (const v of allIntervals) {
      const list = intervalsBySchool.get(v.school_id) ?? [];
      list.push(v);
      intervalsBySchool.set(v.school_id, list);
    }
    return { windowsBySchool, intervalsBySchool };
  } catch (err) {
    console.error(`[NOTIFY-CONFIG] ไม่สามารถดึงการตั้งค่าการแจ้งเตือนจาก DB ได้`, err);
    return null;
  }
}

// ✨ ตรวจสอบว่าเวลาปัจจุบัน (Bangkok) อยู่ในช่วงเวลาที่โรงเรียนนั้นอนุญาตให้แจ้งเตือนหรือไม่
function isWithinNotifyWindow(timeWindows: TimeWindow[]): boolean {
  const now = new Date();
  const bangkokTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
  );
  const currentTotalMin = bangkokTime.getHours() * 60 + bangkokTime.getMinutes();

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

// ✨ ส่งรายงานสถานะเครื่องของโรงเรียนเดียว พร้อม interval ของโรงเรียนนั้นสำหรับ threshold check
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

// ✨ ดึงการตั้งค่าของโรงเรียน — fallback ไปใช้ค่า default ถ้าโรงเรียนยังไม่มีข้อมูลใน DB
function getSchoolConfig(
  schoolId: number,
  windowsBySchool: Map<number, TimeWindow[]>,
  intervalsBySchool: Map<number, NotifyInterval[]>,
): { timeWindows: TimeWindow[]; intervalRound1: number; intervalRound2: number } {
  const timeWindows = windowsBySchool.get(schoolId) ?? DEFAULT_TIME_WINDOWS;
  const intervals = intervalsBySchool.get(schoolId) ?? DEFAULT_INTERVALS;
  const intervalRound1 = intervals.find((v) => v.round === 1 && v.is_active)?.interval_minutes ?? 5;
  const intervalRound2 = intervals.find((v) => v.round === 2 && v.is_active)?.interval_minutes ?? 30;
  return { timeWindows, intervalRound1, intervalRound2 };
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

  // ─── ดึงการตั้งค่าช่วงเวลาและช่วงห่างของทุกโรงเรียนจาก DB ───
  const allConfigs = await fetchAllSchoolConfigs();
  if (!allConfigs) {
    console.log(`[${timestamp}] ⚠ ไม่สามารถดึงการตั้งค่าการแจ้งเตือนได้ — ใช้ค่า default`);
    // ไม่หยุดทำงาน — fallback ไปใช้ default ใน getSchoolConfig แทน
  }
  const windowsBySchool = allConfigs?.windowsBySchool ?? new Map();
  const intervalsBySchool = allConfigs?.intervalsBySchool ?? new Map();

  console.log(`[${timestamp}] ✓ โหลดการตั้งค่าสำเร็จ (${windowsBySchool.size} โรงเรียนมีการตั้งค่าเฉพาะ)`);

  // โหมดทดสอบ — ส่งเฉพาะโรงเรียนที่ระบุ และข้ามการตรวจสอบช่วงเวลา
  if (TEST_SCHOOL_ID !== null) {
    const { intervalRound1, intervalRound2 } = getSchoolConfig(
      TEST_SCHOOL_ID,
      windowsBySchool,
      intervalsBySchool,
    );
    console.log(`[${timestamp}] TEST MODE — school_id=${TEST_SCHOOL_ID}, APP_URL=${APP_URL}`);
    console.log(`[${timestamp}] Interval: รอบแรก ${intervalRound1} นาที, รอบถัดไป ${intervalRound2} นาที`);
    const ok = await sendSchoolReport(TEST_SCHOOL_ID, timestamp, intervalRound1, intervalRound2);
    await PrismaTimesheet.$disconnect();
    await PrismaJabjaiMaster.$disconnect();
    process.exit(ok ? 0 : 1);
  }

  // ─── ดึง LINE Groups ───
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
  let skippedCount = 0;

  for (const group of activeGroups) {
    const schoolId = group.SchoolId!;
    const { timeWindows, intervalRound1, intervalRound2 } = getSchoolConfig(
      schoolId,
      windowsBySchool,
      intervalsBySchool,
    );

    // ─── ตรวจสอบช่วงเวลาแจ้งเตือนของโรงเรียนนี้ ───
    if (!isWithinNotifyWindow(timeWindows)) {
      const windowLabels = timeWindows
        .filter((w) => w.is_active)
        .map((w) => `${String(w.start_hour).padStart(2, "0")}:${String(w.start_min).padStart(2, "0")}–${String(w.end_hour).padStart(2, "0")}:${String(w.end_min).padStart(2, "0")}`)
        .join(", ") || "ไม่มีรอบที่เปิดใช้งาน";
      console.log(`[${timestamp}] School ${schoolId} — นอกช่วงเวลา (${windowLabels}) skipped`);
      skippedCount++;
      continue;
    }

    const ok = await sendSchoolReport(schoolId, timestamp, intervalRound1, intervalRound2);
    if (ok) successCount++;
    else failCount++;
  }

  console.log(`\n${SEP}`);
  console.log(`[${timestamp}] Done — success: ${successCount}, failed: ${failCount}, skipped: ${skippedCount}`);
  console.log(SEP);

  await PrismaTimesheet.$disconnect();
  await PrismaJabjaiMaster.$disconnect();

  if (failCount > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main();
