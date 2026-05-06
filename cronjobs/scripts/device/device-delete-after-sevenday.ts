/**
 * CronJob Script — ลบเครื่องที่ Offline เกิน 7 วันออกจาก DeviceDailyStatus
 * เช็กจาก OnlineTime — ถ้า NULL หรือ OnlineTime < 7 วันที่แล้ว → ลบ
 * Run: bun run cronjobs/scripts/device/device-delete-after-sevenday.ts
 * Dry-run (ไม่ลบจริง): DRY_RUN=true bun run cronjobs/scripts/device/device-delete-after-sevenday.ts
 */

import prisma from "@/helpers/prisma";

const DRY_RUN = process.env.DRY_RUN === "true";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const SEP = "─".repeat(110);
const SEP_SHORT = "─".repeat(110);

// ✨ แปลง timestamp เป็นสตริงภาษาไทย (Bangkok)
function formatDate(date: Date | null): string {
  if (!date) return "ไม่มีข้อมูล";
  return date.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}

// ✨ คำนวณจำนวนวันที่ offline มาแล้ว
function offlineDays(onlineTime: Date | null, now: Date): string {
  if (!onlineTime) return "N/A (ไม่เคย online)";
  const days = Math.floor((now.getTime() - onlineTime.getTime()) / (24 * 60 * 60 * 1000));
  return `${days} วัน`;
}

// ✨ ตัดข้อความให้พอดีความกว้างคอลัมน์
function pad(str: string, len: number): string {
  const display = str.length > len ? str.slice(0, len - 1) + "…" : str;
  return display.padEnd(len);
}

// ✨ ฟังก์ชันหลัก — ค้นหาและลบเครื่องที่ offline เกิน 7 วัน
async function main() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - SEVEN_DAYS_MS);
  const timestamp = now.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });

  console.log(`\n${SEP}`);
  console.log(` Device Cleanup — ลบเครื่อง Offline เกิน 7 วัน`);
  console.log(` เวลาที่รัน : ${timestamp}`);
  console.log(` Cutoff     : ${formatDate(cutoff)} (${cutoff.toISOString()})`);
  console.log(` โหมด       : ${DRY_RUN ? "DRY RUN (ไม่ลบจริง)" : "LIVE (ลบจริง)"}`);
  console.log(`${SEP}\n`);

  // ดึงเครื่องที่ OnlineTime เกิน 7 วัน หรือ OnlineTime เป็น NULL
  const candidates = await prisma.deviceDailyStatus.findMany({
    where: {
      OR: [
        { OnlineTime: { lt: cutoff } },
        { OnlineTime: null },
      ],
    },
    select: {
      DeviceStatusID: true,
      SchoolID: true,
      DeviceID: true,
      AppName: true,
      Note: true,
      OnlineTime: true,
      NotifyEnabled: true,
    },
    orderBy: [{ SchoolID: "asc" }, { OnlineTime: "asc" }],
  });

  if (candidates.length === 0) {
    console.log(" ✅ ไม่พบเครื่องที่ Offline เกิน 7 วัน — ไม่มีอะไรต้องลบ\n");
    await prisma.$disconnect();
    process.exit(0);
  }

  // แสดงตารางรายการที่จะลบ
  console.log(` พบเครื่องที่ Offline เกิน 7 วัน: ${candidates.length} เครื่อง\n`);
  console.log(SEP_SHORT);
  console.log(
    ` ${"#".padEnd(5)} ${pad("SchoolID", 10)} ${pad("DeviceID", 22)} ${pad("AppName", 20)} ${pad("Note (ชื่อเครื่อง)", 22)} ${pad("OnlineTime ล่าสุด", 22)} ${"Offline มา"}`,
  );
  console.log(SEP_SHORT);

  candidates.forEach((d, i) => {
    const onlineTimeStr = d.OnlineTime ? formatDate(d.OnlineTime) : "ไม่เคย online";
    const days = offlineDays(d.OnlineTime, now);
    console.log(
      ` ${String(i + 1).padEnd(5)} ${pad(String(d.SchoolID), 10)} ${pad(d.DeviceID ?? "-", 22)} ${pad(d.AppName ?? "ไม่ระบุ", 20)} ${pad(d.Note?.trim() || "-", 22)} ${pad(onlineTimeStr, 22)} ${days}`,
    );
  });

  console.log(SEP_SHORT);

  // สรุปแยกตาม SchoolID
  const bySchool = new Map<number, number>();
  for (const d of candidates) {
    bySchool.set(d.SchoolID, (bySchool.get(d.SchoolID) ?? 0) + 1);
  }

  console.log(`\n สรุปตามโรงเรียน (${bySchool.size} โรงเรียน):\n`);
  console.log(` ${"SchoolID".padEnd(12)} ${"จำนวนเครื่องที่จะลบ"}`);
  console.log(` ${"─".repeat(30)}`);
  for (const [schoolId, count] of [...bySchool.entries()].sort((a, b) => a[0] - b[0])) {
    console.log(` ${String(schoolId).padEnd(12)} ${count} เครื่อง`);
  }

  if (DRY_RUN) {
    console.log(`\n [DRY RUN] — จะลบทั้งหมด ${candidates.length} รายการ แต่ยังไม่ลบจริง`);
    console.log(` รัน script โดยไม่ใส่ DRY_RUN=true เพื่อลบจริง\n`);
    await prisma.$disconnect();
    process.exit(0);
  }

  // ลบจริง
  console.log(`\n กำลังลบ ${candidates.length} รายการ...`);

  const idsToDelete = candidates.map((d) => d.DeviceStatusID);
  const result = await prisma.deviceDailyStatus.deleteMany({
    where: { DeviceStatusID: { in: idsToDelete } },
  });

  console.log(`\n${SEP}`);
  console.log(` ✅ ลบสำเร็จ ${result.count} รายการ`);
  console.log(`${SEP}\n`);

  await prisma.$disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("\n ❌ ERROR:", err);
  await prisma.$disconnect();
  process.exit(1);
});
