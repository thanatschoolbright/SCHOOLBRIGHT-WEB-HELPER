/**
 * CronJob Script — ตรวจสอบสถานะ Mobile API ทุก 1 นาที
 * รันโดย Kubernetes CronJob ทุก * * * * * (Asia/Bangkok)
 * ขั้นตอน:
 *   1. รัน health check ทุก endpoint พร้อมกัน
 *   2. วิเคราะห์ผลลัพธ์
 *   3. ส่งแจ้งเตือน Discord เสมอ (ทั้ง healthy และ critical)
 * ไม่เรียก HTTP internal — import service functions โดยตรง
 */

import {
  analyzeHealthResults,
  executeHealthChecksService,
  sendDiscordNotificationService,
} from "@/app/api/v1/health-check/server/system/service/health-check-service";

const SEP = "─".repeat(70);

// ✨ จุดเริ่มต้นหลักของ script
async function main() {
  const startTime = performance.now();
  const now = new Date();

  console.log(SEP);
  console.log(`[MOBILE-API-CHECK] เริ่มต้น ${now.toISOString()}`);
  console.log(SEP);

  // --- ขั้นตอนที่ 1: รัน Health Check ทุก endpoint ---
  console.log("\n[STEP 1] รัน Health Check...");
  const results = await executeHealthChecksService();

  // --- ขั้นตอนที่ 2: วิเคราะห์ผล ---
  const stats = analyzeHealthResults(results);
  const statusIcon = stats.failed.length === 0 ? "✅" : "❌";

  console.log(`\n[STEP 2] ผลการตรวจสอบ ${statusIcon}`);
  console.log(`  ทั้งหมด  : ${stats.total} รายการ`);
  console.log(`  ผ่าน     : ${stats.passed.length} รายการ`);
  console.log(`  ล้มเหลว  : ${stats.failed.length} รายการ`);
  console.log(`  คะแนน    : ${stats.healthScore}%`);

  if (stats.failed.length > 0) {
    console.log("\n  รายการที่ล้มเหลว:");
    for (const item of stats.failed) {
      console.log(`  ✗ [${item.status}] ${item.name_th} (${item.service})`);
    }
  }

  // --- ขั้นตอนที่ 3: ส่ง Discord ---
  console.log("\n[STEP 3] ส่งแจ้งเตือน Discord...");
  await sendDiscordNotificationService(results);
  console.log("  ✓ ส่งเรียบร้อย");

  const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
  console.log(`\n${SEP}`);
  console.log(`[MOBILE-API-CHECK] เสร็จสิ้น ใช้เวลา ${elapsed}s`);
  console.log(SEP);
}

main().catch((err) => {
  console.error("[MOBILE-API-CHECK] ERROR:", err);
  process.exit(1);
});
