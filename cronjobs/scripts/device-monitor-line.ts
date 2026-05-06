/**
 * CronJob Script — ตรวจสอบสถานะ Hardware และส่งแจ้งเตือนผ่าน LINE
 * รันโดย Kubernetes CronJob ทุก 1 นาที (Asia/Bangkok)
 * Time Condition: 18:00–06:00 ระงับการแจ้งเตือน
 */

import { PrismaJabjaiMaster } from "@/helpers/prisma/prisma-jabjai-master-single-db";

const APP_URL =
  process.env.APP_INTERNAL_URL ?? "http://sb-helper.schoolbright.co";
const CRON_SECRET = process.env.CRON_SECRET ?? "";

// TEST_SCHOOL_ID=849 จะ bypass quiet hours และส่งเฉพาะโรงเรียนนั้น (ใช้ทดสอบ local)
const TEST_SCHOOL_ID = process.env.TEST_SCHOOL_ID
  ? parseInt(process.env.TEST_SCHOOL_ID, 10)
  : null;

// ✨ ตรวจสอบ Time Condition — ช่วง 18:00-06:00 ไม่ส่งแจ้งเตือน
function isQuietHours(): boolean {
  const now = new Date();
  const bangkokTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
  );
  const hour = bangkokTime.getHours();
  return hour >= 18 || hour < 6;
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

  console.log(`\n${"─".repeat(90)}`);
  console.log(` LINE Groups ที่พบทั้งหมด: ${groups.length} กลุ่ม`);
  console.log(`${"─".repeat(90)}`);
  console.log(
    ` ${"#".padEnd(5)} ${"LineGroupId".padEnd(12)} ${"SchoolId".padEnd(
      10,
    )} ${"GroupType".padEnd(15)} ${"GroupId".padEnd(35)} ${"CreateDate"}`,
  );
  console.log(`${"─".repeat(90)}`);

  groups.forEach((g, i) => {
    const date = g.CreateDate
      ? new Date(g.CreateDate).toLocaleDateString("th-TH", {
          timeZone: "Asia/Bangkok",
        })
      : "-";
    console.log(
      ` ${String(i + 1).padEnd(5)} ${String(g.LineGroupId).padEnd(12)} ${String(
        g.SchoolId ?? "-",
      ).padEnd(10)} ${(g.GroupType ?? "-").padEnd(15)} ${(
        g.GroupId ?? "-"
      ).padEnd(35)} ${date}`,
    );
  });

  console.log(`${"─".repeat(90)}\n`);
  return groups;
}

// ✨ ส่งรายงานสถานะเครื่องของโรงเรียนเดียวไปยัง LINE Group
async function sendSchoolReport(
  schoolId: number,
  timestamp: string,
): Promise<boolean> {
  try {
    const response = await fetch(
      `${APP_URL}/api/v2/hardware/school-device/cronjob/${schoolId}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
        signal: AbortSignal.timeout(30_000),
      },
    );

    const body = await response.json();
    console.log(
      `[${timestamp}] School ${schoolId} — HTTP ${response.status}`,
    );
    console.log(
      `[${timestamp}] School ${schoolId} — Response:`,
      JSON.stringify(body, null, 2),
    );

    return response.ok;
  } catch (error) {
    console.error(`[${timestamp}] School ${schoolId} — ERROR:`, error);
    return false;
  }
}

// ✨ ฟังก์ชันหลัก — ดึง LINE Groups แล้วส่งรายงานทีละโรงเรียน
async function main() {
  const timestamp = new Date().toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
  });
  console.log(`[${timestamp}] Starting device monitor...`);

  // โหมดทดสอบ — ส่งเฉพาะโรงเรียนที่ระบุ และข้าม quiet hours
  if (TEST_SCHOOL_ID !== null) {
    console.log(
      `[${timestamp}] TEST MODE — school_id=${TEST_SCHOOL_ID}, APP_URL=${APP_URL}`,
    );
    const ok = await sendSchoolReport(TEST_SCHOOL_ID, timestamp);
    process.exit(ok ? 0 : 1);
  }

  if (isQuietHours()) {
    console.log(
      `[${timestamp}] Quiet hours (18:00–06:00) — skipping notification`,
    );
    process.exit(0);
  }

  // ดึงและแสดงรายชื่อ LINE Groups
  const groups = await fetchAndDisplayLineGroups();

  if (groups.length === 0) {
    console.log(`[${timestamp}] ไม่พบ LINE Group ในระบบ — skipping`);
    process.exit(0);
  }

  // กรองเฉพาะโรงเรียนที่มี SchoolId และ GroupId ที่ใช้งานได้
  const activeGroups = groups.filter(
    (g) => g.SchoolId !== null && g.GroupId !== null && g.GroupId.trim() !== "",
  );

  console.log(
    `[${timestamp}] Active groups with valid SchoolId+GroupId: ${activeGroups.length}`,
  );

  // ส่งรายงานทีละโรงเรียน
  let successCount = 0;
  let failCount = 0;

  for (const group of activeGroups) {
    const schoolId = group.SchoolId!;
    const ok = await sendSchoolReport(schoolId, timestamp);
    if (ok) successCount++;
    else failCount++;
  }

  console.log(
    `[${timestamp}] Done — success: ${successCount}, failed: ${failCount}`,
  );

  if (failCount > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main();
