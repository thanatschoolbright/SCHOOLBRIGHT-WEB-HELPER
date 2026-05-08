/**
 * CronJob Script — ตรวจสอบสถานะ Hardware และส่งแจ้งเตือนผ่าน LINE
 * รันโดย Kubernetes CronJob ทุก 1 นาที (Asia/Bangkok)
 * Time Condition: อ่านจาก DB (DeviceNotifyTimeWindow) — ไม่ hardcode
 * Interval Condition: อ่านจาก DB (DeviceNotifyInterval) — ไม่ hardcode
 * Bot Condition: เช็กจาก bot_setting.line_bot_enabled ใน Timesheet DB ก่อนทำงานทุกครั้ง
 * ไม่ยิง HTTP — เรียก service functions โดยตรง
 */

import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { PrismaJabjaiMaster } from "@/helpers/prisma/prisma-jabjai-master-single-db";
import {
  buildSchoolDeviceReport,
  buildSchoolDeviceStatusData,
  checkAndUpdateNotifyState,
  linePushMessage,
} from "@/services/line/line-push.service";

// TEST_SCHOOL_ID=849 จะ bypass quiet hours และส่งเฉพาะโรงเรียนนั้น (ใช้ทดสอบ local)
const TEST_SCHOOL_ID = process.env.TEST_SCHOOL_ID
  ? parseInt(process.env.TEST_SCHOOL_ID, 10)
  : null;

const SEP = "─".repeat(70);

console.log(`[CONFIG] TEST_SCHOOL_ID=${TEST_SCHOOL_ID ?? "(ทุกโรงเรียน)"}`);

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
    console.error(
      `[BOT-SETTING] ไม่สามารถดึงสถานะ Bot ได้ — ใช้ค่า default: เปิด`,
      err,
    );
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
  {
    round: 1,
    label: "รอบเช้า",
    start_hour: 6,
    start_min: 0,
    end_hour: 8,
    end_min: 0,
    is_active: true,
  },
  {
    round: 2,
    label: "รอบบ่าย",
    start_hour: 15,
    start_min: 0,
    end_hour: 17,
    end_min: 0,
    is_active: true,
  },
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
      PrismaJabjaiMaster.deviceNotifyTimeWindow.findMany({
        orderBy: { round: "asc" },
      }),
      PrismaJabjaiMaster.deviceNotifyInterval.findMany({
        orderBy: { round: "asc" },
      }),
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
    console.error(
      `[NOTIFY-CONFIG] ไม่สามารถดึงการตั้งค่าการแจ้งเตือนจาก DB ได้`,
      err,
    );
    return null;
  }
}

// ✨ ตรวจสอบว่าเวลาปัจจุบัน (Bangkok) อยู่ในช่วงเวลาที่โรงเรียนนั้นอนุญาตให้แจ้งเตือนหรือไม่
function isWithinNotifyWindow(timeWindows: TimeWindow[]): boolean {
  const now = new Date();
  const bangkokTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
  );
  const currentTotalMin =
    bangkokTime.getHours() * 60 + bangkokTime.getMinutes();

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
  console.log(`${SEP}\n`);
  return groups;
}

// ✨ ดึงการตั้งค่าของโรงเรียน — fallback ไปใช้ค่า default ถ้าโรงเรียนยังไม่มีข้อมูลใน DB
function getSchoolConfig(
  schoolId: number,
  windowsBySchool: Map<number, TimeWindow[]>,
  intervalsBySchool: Map<number, NotifyInterval[]>,
): {
  timeWindows: TimeWindow[];
  intervalRound1: number;
  intervalRound2: number;
} {
  const timeWindows = windowsBySchool.get(schoolId) ?? DEFAULT_TIME_WINDOWS;
  const intervals = intervalsBySchool.get(schoolId) ?? DEFAULT_INTERVALS;
  const intervalRound1 =
    intervals.find((v) => v.round === 1 && v.is_active)?.interval_minutes ?? 5;
  const intervalRound2 =
    intervals.find((v) => v.round === 2 && v.is_active)?.interval_minutes ?? 30;
  return { timeWindows, intervalRound1, intervalRound2 };
}

// ✨ ส่งรายงานสถานะเครื่องของโรงเรียนเดียว — เรียก service โดยตรงไม่ผ่าน HTTP
async function sendSchoolReport(
  schoolId: number,
  groupId: string,
  timestamp: string,
  intervalRound1: number,
  intervalRound2: number,
): Promise<boolean> {
  try {
    const deviceData = await buildSchoolDeviceStatusData(schoolId);
    if (!deviceData) {
      console.log(`[${timestamp}] School ${schoolId} — ไม่พบข้อมูลโรงเรียน`);
      return false;
    }

    const {
      result: shouldNotify,
      notifyRound,
      debugLines,
    } = await checkAndUpdateNotifyState(
      schoolId,
      deviceData.devices,
      intervalRound1,
      intervalRound2,
    );

    console.log(
      `[THRESHOLD] school=${schoolId} interval=[${intervalRound1},${intervalRound2}] offline=${
        deviceData.devices.filter((d) => !d.is_online).length
      } เครื่อง`,
    );
    for (const line of debugLines) console.log(`[THRESHOLD]${line}`);
    console.log(
      `[THRESHOLD] → shouldNotify=${shouldNotify} notifyRound=${notifyRound}`,
    );

    if (!shouldNotify) {
      console.log(
        `[${timestamp}] School ${schoolId} — ไม่มีเครื่องถึงเกณฑ์ skipped`,
      );
      return true;
    }

    const { messages } = await buildSchoolDeviceReport(schoolId);
    await linePushMessage(groupId, messages);
    console.log(
      `[${timestamp}] School ${schoolId} — ส่ง LINE สำเร็จ (round=${notifyRound})`,
    );
    return true;
  } catch (err) {
    console.error(`[${timestamp}] School ${schoolId} — ERROR:`, err);
    return false;
  }
}

// ✨ ฟังก์ชันหลัก — เช็กสถานะ Bot, ช่วงเวลา, แล้วส่งรายงานทีละโรงเรียน
async function main() {
  const timestamp = new Date().toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
  });
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
    console.log(
      `[${timestamp}]   → หากต้องการเปิดใช้งาน กรุณาไปที่หน้า Web Admin`,
    );
    console.log(
      `[${timestamp}]   → เส้นทาง: ตรวจสอบสถานะอุปกรณ์ → ปุ่มตั้งค่า → เปิด LINE Bot`,
    );
    console.log(SEP);
    await PrismaTimesheet.$disconnect();
    process.exit(0);
  }
  console.log(`[${timestamp}] ✓ Bot Status: เปิดใช้งาน`);

  // ─── ดึงการตั้งค่าช่วงเวลาและช่วงห่างของทุกโรงเรียนจาก DB ───
  const allConfigs = await fetchAllSchoolConfigs();
  if (!allConfigs) {
    console.log(
      `[${timestamp}] ⚠ ไม่สามารถดึงการตั้งค่าการแจ้งเตือนได้ — ใช้ค่า default`,
    );
  }
  const windowsBySchool = allConfigs?.windowsBySchool ?? new Map();
  const intervalsBySchool = allConfigs?.intervalsBySchool ?? new Map();

  console.log(
    `[${timestamp}] ✓ โหลดการตั้งค่าสำเร็จ (${windowsBySchool.size} โรงเรียนมีการตั้งค่าเฉพาะ)`,
  );

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

  console.log(
    `[${timestamp}] Active groups with valid SchoolId+GroupId: ${activeGroups.length}`,
  );

  // โหมดทดสอบ — ส่งเฉพาะโรงเรียนที่ระบุ และข้ามการตรวจสอบช่วงเวลา
  if (TEST_SCHOOL_ID !== null) {
    const { intervalRound1, intervalRound2 } = getSchoolConfig(
      TEST_SCHOOL_ID,
      windowsBySchool,
      intervalsBySchool,
    );
    const group = activeGroups.find((g) => g.SchoolId === TEST_SCHOOL_ID);
    const groupId =
      group?.GroupId ?? process.env.LINE_MONITORING_GROUP_ID ?? null;
    console.log(
      `[${timestamp}] TEST MODE — school_id=${TEST_SCHOOL_ID}, group_id=${
        groupId ?? "(ไม่พบ)"
      }`,
    );
    console.log(
      `[${timestamp}] Interval: รอบแรก ${intervalRound1} นาที, รอบถัดไป ${intervalRound2} นาที`,
    );
    if (!groupId) {
      console.error(
        `[${timestamp}] ไม่พบ GroupId สำหรับโรงเรียน ${TEST_SCHOOL_ID}`,
      );
      await PrismaTimesheet.$disconnect();
      await PrismaJabjaiMaster.$disconnect();
      process.exit(1);
    }
    const ok = await sendSchoolReport(
      TEST_SCHOOL_ID,
      groupId,
      timestamp,
      intervalRound1,
      intervalRound2,
    );
    await PrismaTimesheet.$disconnect();
    await PrismaJabjaiMaster.$disconnect();
    process.exit(ok ? 0 : 1);
  }

  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  for (const group of activeGroups) {
    const schoolId = group.SchoolId!;
    const groupId = group.GroupId!;
    const { timeWindows, intervalRound1, intervalRound2 } = getSchoolConfig(
      schoolId,
      windowsBySchool,
      intervalsBySchool,
    );

    // ─── ตรวจสอบช่วงเวลาแจ้งเตือนของโรงเรียนนี้ ───
    if (!isWithinNotifyWindow(timeWindows)) {
      const windowLabels =
        timeWindows
          .filter((w) => w.is_active)
          .map(
            (w) =>
              `${String(w.start_hour).padStart(2, "0")}:${String(
                w.start_min,
              ).padStart(2, "0")}–${String(w.end_hour).padStart(
                2,
                "0",
              )}:${String(w.end_min).padStart(2, "0")}`,
          )
          .join(", ") || "ไม่มีรอบที่เปิดใช้งาน";

      skippedCount++;
      continue;
    }

    const ok = await sendSchoolReport(
      schoolId,
      groupId,
      timestamp,
      intervalRound1,
      intervalRound2,
    );
    if (ok) successCount++;
    else failCount++;
  }

  console.log(`\n${SEP}`);
  console.log(
    `[${timestamp}] Done — success: ${successCount}, failed: ${failCount}, skipped: ${skippedCount}`,
  );
  console.log(SEP);

  await PrismaTimesheet.$disconnect();
  await PrismaJabjaiMaster.$disconnect();

  if (failCount > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main();
