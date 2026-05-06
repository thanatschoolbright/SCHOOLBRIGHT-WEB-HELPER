/**
 * CronJob Script — ตรวจสอบสถานะ Hardware และส่งแจ้งเตือนผ่าน LINE
 * รันโดย Kubernetes CronJob ทุก 1 นาที (Asia/Bangkok)
 * Time Condition: 18:00–06:00 ระงับการแจ้งเตือน
 */

import { PrismaJabjaiMaster } from "@/helpers/prisma/prisma-jabjai-master-single-db";

const APP_URL =
  process.env.APP_INTERNAL_URL ?? "http://sb-helper.schoolbright.co";
const CRON_SECRET = process.env.CRON_SECRET ?? "";

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

// ✨ ฟังก์ชันหลัก — ดึง LINE Groups แล้วเรียก API ส่งแจ้งเตือน
async function main() {
  const timestamp = new Date().toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
  });
  console.log(`[${timestamp}] Starting device monitor...`);

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

  // เรียก API ส่งแจ้งเตือน
  try {
    const response = await fetch(
      `${APP_URL}/api/v1/hardware/machine-monitoring/channel/line`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
        signal: AbortSignal.timeout(10_000),
      },
    );

    const body = await response.json();
    console.log(`[${timestamp}] HTTP Status: ${response.status}`);
    console.log(`[${timestamp}] Response:`, JSON.stringify(body, null, 2));

    if (!response.ok) {
      console.error(`[${timestamp}] FAILED — status ${response.status}`);
      process.exit(1);
    }

    console.log(`[${timestamp}] SUCCESS`);
    process.exit(0);
  } catch (error) {
    console.error(`[${timestamp}] ERROR:`, error);
    process.exit(1);
  }
}

main();
