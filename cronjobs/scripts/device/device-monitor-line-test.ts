/**
 * TEST SCRIPT — ทดสอบส่งรายงานสถานะเครื่องเฉพาะโรงเรียนทดสอบ (school_id=849, GroupType=test)
 * ใช้สำหรับ verify ก่อน deploy จริง — ไม่ส่งไปโรงเรียนจริง
 * เช็กสถานะ Bot ก่อนทำงานเสมอ เช่นเดียวกับ production script
 *
 * Run: bun run cronjobs/scripts/device/device-monitor-line-test.ts
 */

import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

const APP_URL = process.env.APP_INTERNAL_URL ?? "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET ?? "";

// school_id ทดสอบ (GroupType=test, GroupId=Cf98092bd75efb8c297ae0132ea663afb)
const TEST_SCHOOL_ID = 849;

const SEP = "─".repeat(70);

// ✨ เช็กสถานะเปิด/ปิด Bot จาก Timesheet DB — คืน true ถ้าเปิดใช้งาน
async function isBotEnabled(): Promise<{ enabled: boolean; updatedBy: number | null; updatedAt: Date | null }> {
  try {
    const row = await PrismaTimesheet.botSetting.findUnique({
      where: { key: "line_bot_enabled" },
      select: { value: true, updated_by: true, updated_at: true },
    });
    if (!row) return { enabled: true, updatedBy: null, updatedAt: null };
    return { enabled: row.value === "true", updatedBy: row.updated_by, updatedAt: row.updated_at };
  } catch (err) {
    console.error(`[BOT-SETTING] ไม่สามารถดึงสถานะ Bot ได้ — ใช้ค่า default: เปิด`, err);
    return { enabled: true, updatedBy: null, updatedAt: null };
  }
}

async function main() {
  const timestamp = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });

  console.log(`\n${SEP}`);
  console.log(`[${timestamp}] === TEST MODE — school_id=${TEST_SCHOOL_ID} ===`);
  console.log(`[${timestamp}] APP_URL      : ${APP_URL}`);
  console.log(`[${timestamp}] CRON_SECRET  : ${CRON_SECRET ? "SET" : "NOT SET"}`);
  console.log(SEP);

  // ─── ตรวจสอบ Bot Status (ระดับสูงสุด) ───
  const { enabled: botEnabled, updatedBy, updatedAt } = await isBotEnabled();

  console.log(`[${timestamp}] Bot Status   : ${botEnabled ? "✓ เปิดใช้งาน" : "✗ ปิดใช้งาน"}`);
  if (updatedAt) {
    console.log(`[${timestamp}] Updated At   : ${updatedAt.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}`);
  }
  if (updatedBy) {
    console.log(`[${timestamp}] Updated By   : user_id=${updatedBy}`);
  }

  if (!botEnabled) {
    console.log(`\n${SEP}`);
    console.log(`[${timestamp}] ⚠ มีการปิดการใช้งาน LINE Bot ในระบบ`);
    console.log(`[${timestamp}]   → ระบบจะไม่ทำการ Query ข้อมูลอุปกรณ์`);
    console.log(`[${timestamp}]   → ระบบจะไม่ส่งการแจ้งเตือนไปยัง LINE แม้ในโหมดทดสอบ`);
    console.log(`[${timestamp}]   → หากต้องการเปิดใช้งาน กรุณาไปที่หน้า Web Admin`);
    console.log(`[${timestamp}]   → เส้นทาง: ตรวจสอบสถานะอุปกรณ์ → ปุ่มตั้งค่า → เปิด LINE Bot`);
    console.log(SEP);
    await PrismaTimesheet.$disconnect();
    process.exit(0);
  }

  // ─── ส่งรายงานไปโรงเรียนทดสอบ ───
  try {
    const url = `${APP_URL}/api/v2/hardware/school-device/cronjob/${TEST_SCHOOL_ID}`;
    console.log(`[${timestamp}] Calling     : GET ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      signal: AbortSignal.timeout(30_000),
    });

    const body = await response.json();
    console.log(`\n${SEP}`);
    console.log(`[${timestamp}] HTTP Status : ${response.status}`);

    if (!response.ok) {
      console.error(`[${timestamp}] FAILED — status ${response.status}`);
      console.error(`[${timestamp}] Response   :`, JSON.stringify(body, null, 2));
      await PrismaTimesheet.$disconnect();
      process.exit(1);
    }

    const data = body?.data;
    console.log(`[${timestamp}] === SUMMARY ===`);
    console.log(`[${timestamp}] School      : ${data?.school_name} (${data?.school_id})`);
    console.log(`[${timestamp}] Total       : ${data?.total} เครื่อง`);
    console.log(`[${timestamp}] Online      : ${data?.online}`);
    console.log(`[${timestamp}] Offline     : ${data?.offline}`);
    console.log(
      `[${timestamp}] LINE        : ${data?.line?.success ? "SUCCESS" : "FAILED"} — group_id=${data?.line?.group_id}`,
    );
    if (data?.line?.error) {
      console.error(`[${timestamp}] LINE Err    : ${data.line.error}`);
    }
    console.log(`[${timestamp}] SUCCESS`);
    console.log(SEP);

    await PrismaTimesheet.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`[${timestamp}] ERROR:`, error);
    await PrismaTimesheet.$disconnect();
    process.exit(1);
  }
}

main();
