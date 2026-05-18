/**
 * CronJob Script — ตั้งชื่อเล่น (Note) อัตโนมัติให้กับอุปกรณ์ที่ยังไม่มีชื่อ
 * เกณฑ์การตั้งชื่อ (จับคู่จาก AppName):
 *   .SB Canteen               → "เครื่องแคนทีน เครื่องที่ N"
 *   .SB mini app              → "เครื่องมินิแอป เครื่องที่ N"
 *   SB Facial Attendance 5 inches  → "เครื่องแสกนหน้า (v.2) N"
 *   SB Facial Attendance 8 inch    → "เครื่องแสกนหน้า (v.1) N"
 *
 * การนับ N: นับต่อจาก Note ที่มีอยู่แล้วในโรงเรียนเดียวกัน (ชื่อไม่ซ้ำกันแน่นอน)
 * Run     : bun run cronjobs/scripts/device/device-auto-set-name.ts
 * Dry-run : DRY_RUN=true bun run cronjobs/scripts/device/device-auto-set-name.ts
 */

import prisma from "@/helpers/prisma";

const DRY_RUN = process.env.DRY_RUN === "true";

const SEP = "─".repeat(110);

// ✨ mapping AppName (lowercase) → ชื่อ prefix สำหรับตั้งชื่อ
const APP_NAME_MAP: { match: string; prefix: string }[] = [
  { match: ".sb canteen", prefix: "เครื่องแคนทีน เครื่องที่" },
  { match: ".sb mini app", prefix: "เครื่องมินิแอป เครื่องที่" },
  { match: "sb facial attendance 5 inches", prefix: "เครื่องแสกนหน้า (v.2)" },
  { match: "sb facial attendance 8 inch", prefix: "เครื่องแสกนหน้า (v.1)" },
];

// ✨ หา prefix ที่ตรงกับ AppName — คืน null ถ้าไม่มีในรายการ
function resolvePrefix(appName: string | null): string | null {
  if (!appName) return null;
  const lower = appName.toLowerCase().trim();
  const found = APP_NAME_MAP.find((r) => lower === r.match);
  return found?.prefix ?? null;
}

// ✨ ตัดข้อความให้พอดีความกว้าง column แล้วเติม space ด้านหลัง
function pad(str: string, len: number): string {
  const s = str.length > len ? str.slice(0, len - 1) + "…" : str;
  return s.padEnd(len);
}

// ✨ ฟังก์ชันหลัก — scan เครื่องที่ Note เป็น null แล้วตั้งชื่ออัตโนมัติ
async function main() {
  const now = new Date();
  const timestamp = now.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });

  console.log(`\n${SEP}`);
  console.log(` Device Auto Set Name — ตั้งชื่อเล่นอุปกรณ์อัตโนมัติ`);
  console.log(` เวลาที่รัน : ${timestamp}`);
  console.log(
    ` โหมด       : ${
      DRY_RUN ? "DRY RUN (ไม่บันทึกจริง)" : "LIVE (บันทึกจริง)"
    }`,
  );
  console.log(SEP);

  // ─── ดึงเครื่องทั้งหมดที่ Note เป็น null ───
  const unnamed = await prisma.deviceDailyStatus.findMany({
    where: { Note: null },
    select: {
      DeviceStatusID: true,
      SchoolID: true,
      DeviceID: true,
      AppName: true,
    },
    orderBy: [{ SchoolID: "asc" }, { AppName: "asc" }, { DeviceID: "asc" }],
  });

  if (unnamed.length === 0) {
    console.log(`\n ✅ ไม่พบเครื่องที่ยังไม่มีชื่อ — ไม่มีอะไรต้องอัพเดท\n`);
    await prisma.$disconnect();
    process.exit(0);
  }

  // กรองเฉพาะเครื่องที่ AppName ตรงกับ mapping
  const targets = unnamed.filter((d) => resolvePrefix(d.AppName) !== null);
  const skipped = unnamed.length - targets.length;

  console.log(
    `\n พบเครื่องที่ Note เป็น null ทั้งหมด  : ${unnamed.length} เครื่อง`,
  );
  console.log(
    ` ตรงกับ mapping และจะตั้งชื่อ         : ${targets.length} เครื่อง`,
  );
  console.log(` ไม่มีใน mapping (ข้าม)               : ${skipped} เครื่อง\n`);

  if (targets.length === 0) {
    console.log(` ✅ ไม่มีเครื่องที่ตรง mapping — จบการทำงาน\n`);
    await prisma.$disconnect();
    process.exit(0);
  }

  // ─── ดึง Note ที่มีอยู่แล้วในแต่ละโรงเรียน เพื่อหา N ถัดไปที่ไม่ซ้ำ ───
  const schoolIds = [...new Set(targets.map((d) => d.SchoolID))];

  const existingNotes = await prisma.deviceDailyStatus.findMany({
    where: {
      SchoolID: { in: schoolIds },
      Note: { not: null },
    },
    select: { SchoolID: true, Note: true },
  });

  // สร้าง Set ของ Note ที่มีอยู่แล้วต่อโรงเรียน
  const usedNotes = new Map<number, Set<string>>();
  for (const row of existingNotes) {
    if (!usedNotes.has(row.SchoolID)) usedNotes.set(row.SchoolID, new Set());
    if (row.Note) usedNotes.get(row.SchoolID)!.add(row.Note.trim());
  }

  // ─── สร้างชื่อสำหรับแต่ละเครื่อง ───
  // counter แยกต่อ (schoolId, prefix) เพื่อนับเลขต่อเนื่องภายในกลุ่มเดียวกัน
  const counterMap = new Map<string, number>();

  const assignments: {
    id: string;
    schoolId: number;
    deviceId: string;
    appName: string;
    newNote: string;
  }[] = [];

  for (const device of targets) {
    const prefix = resolvePrefix(device.AppName)!;
    const schoolSet = usedNotes.get(device.SchoolID) ?? new Set<string>();
    const counterKey = `${device.SchoolID}::${prefix}`;

    let n = (counterMap.get(counterKey) ?? 0) + 1;

    // วนหา N ที่ไม่ซ้ำกับที่มีอยู่แล้วและที่กำลังจะตั้งในรอบนี้
    let candidate = `${prefix} ${n}`;
    while (schoolSet.has(candidate)) {
      n++;
      candidate = `${prefix} ${n}`;
    }

    // จองชื่อนี้ไว้ก่อน (ป้องกันซ้ำกันภายใน batch เดียวกัน)
    schoolSet.add(candidate);
    usedNotes.set(device.SchoolID, schoolSet);
    counterMap.set(counterKey, n);

    assignments.push({
      id: device.DeviceStatusID,
      schoolId: device.SchoolID,
      deviceId: device.DeviceID ?? "-",
      appName: device.AppName ?? "-",
      newNote: candidate,
    });
  }

  // ─── แสดงตารางรายการที่จะตั้งชื่อ ───
  console.log(SEP);
  console.log(
    ` ${"#".padEnd(5)} ${pad("SchoolID", 10)} ${pad("DeviceID", 22)} ${pad(
      "AppName",
      30,
    )} ${"ชื่อที่จะตั้ง"}`,
  );
  console.log(SEP);

  assignments.forEach((a, i) => {
    console.log(
      ` ${String(i + 1).padEnd(5)} ${pad(String(a.schoolId), 10)} ${pad(
        a.deviceId,
        22,
      )} ${pad(a.appName, 30)} ${a.newNote}`,
    );
  });

  console.log(SEP);

  // สรุปแยกตาม prefix
  const byPrefix = new Map<string, number>();
  for (const a of assignments) {
    const prefix = resolvePrefix(a.appName)!;
    byPrefix.set(prefix, (byPrefix.get(prefix) ?? 0) + 1);
  }

  console.log(`\n สรุปตามประเภทอุปกรณ์:\n`);
  console.log(` ${"ประเภท".padEnd(35)} จำนวน`);
  console.log(` ${"─".repeat(45)}`);
  for (const [prefix, count] of byPrefix.entries()) {
    console.log(` ${prefix.padEnd(35)} ${count} เครื่อง`);
  }

  if (DRY_RUN) {
    console.log(
      `\n [DRY RUN] — จะตั้งชื่อ ${assignments.length} รายการ แต่ยังไม่บันทึกจริง`,
    );
    console.log(` รัน script โดยไม่ใส่ DRY_RUN=true เพื่อบันทึกจริง\n`);
    await prisma.$disconnect();
    process.exit(0);
  }

  // ─── อัพเดท Note ทีละรายการ ───
  console.log(`\n กำลังบันทึก ${assignments.length} รายการ...`);

  let successCount = 0;
  let failCount = 0;

  for (const a of assignments) {
    try {
      await prisma.deviceDailyStatus.update({
        where: { DeviceStatusID: a.id },
        data: { Note: a.newNote },
      });
      successCount++;
    } catch (err) {
      console.error(
        ` ✗ ล้มเหลว — DeviceStatusID=${a.id} DeviceID=${a.deviceId}: ${err}`,
      );
      failCount++;
    }
  }

  console.log(`\n${SEP}`);
  console.log(` ✅ บันทึกสำเร็จ  : ${successCount} รายการ`);
  if (failCount > 0) {
    console.log(` ✗ ล้มเหลว       : ${failCount} รายการ`);
  }
  console.log(SEP);

  await prisma.$disconnect();
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error("\n ❌ ERROR:", err);
  await prisma.$disconnect();
  process.exit(1);
});
