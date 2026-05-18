/**
 * CronJob Script — สรุป log สถานะ Server เป็น Daily Summary รายวัน
 * รันโดย Kubernetes CronJob ทุกวัน เวลา 00:05 น. (Asia/Bangkok)
 * ขั้นตอน:
 *   1. aggregate log วันก่อนหน้าที่ยังไม่ได้สรุป → server_status_daily_summary
 *   2. ลบ log เก่า (เฉพาะวันก่อนหน้า) ออกจาก api_log เพื่อประหยัดพื้นที่
 * ไม่เรียก HTTP — query Prisma โดยตรง (ไม่ต้องการ session)
 */

import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

const SEP = "─".repeat(70);

// ตรวจสอบ DRY_RUN mode — ถ้าเปิดจะไม่ write ข้อมูลจริง
const DRY_RUN = process.env.DRY_RUN === "true";

// ✨ หาวันที่ทั้งหมดที่มี log แต่ยังไม่มี summary (ยกเว้นวันนี้)
async function getUnsummarizedDates(today: Date): Promise<Date[]> {
  const distinctDates = await PrismaTimesheet.$queryRaw<Array<{ log_date: Date }>>`
    SELECT DISTINCT DATE_TRUNC('day', request_time) AS log_date
    FROM api_log
    WHERE service_name = 'SERVER_STATUS_MONITOR'
      AND request_time < ${today}
    ORDER BY log_date ASC
  `;

  const existingSummaryDates = await PrismaTimesheet.serverStatusDailySummary.findMany({
    select: { summary_date: true },
    distinct: ["summary_date"],
  });

  const existingSet = new Set(
    existingSummaryDates.map((s) => s.summary_date.toISOString().split("T")[0])
  );

  return distinctDates
    .map((d) => d.log_date)
    .filter((d) => !existingSet.has(new Date(d).toISOString().split("T")[0]));
}

// ✨ สรุป log ของวันที่กำหนด → upsert ลง server_status_daily_summary
async function aggregateDate(date: Date): Promise<number> {
  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(date);
  dateEnd.setHours(23, 59, 59, 999);

  const logs = await PrismaTimesheet.apiLog.findMany({
    where: {
      service_name: "SERVER_STATUS_MONITOR",
      request_time: { gte: dateStart, lte: dateEnd },
    },
    select: {
      trace_id: true,
      called_by: true,
      duration_ms: true,
      response_body: true,
    },
  });

  // จัดกลุ่มตาม server_key (trace_id)
  const serverMap = new Map<string, {
    server_name_th: string;
    online: number;
    offline: number;
    durations: number[];
  }>();

  for (const log of logs) {
    const key = log.trace_id ?? "unknown";
    const nameTh = (log.response_body as any)?.server_name_th ?? key;
    if (!serverMap.has(key)) {
      serverMap.set(key, { server_name_th: nameTh, online: 0, offline: 0, durations: [] });
    }
    const entry = serverMap.get(key)!;
    if (log.called_by === "Online") entry.online++;
    else entry.offline++;
    if (log.duration_ms != null) entry.durations.push(log.duration_ms);
  }

  if (serverMap.size === 0) return 0;

  let rowsCreated = 0;
  for (const [serverKey, stats] of serverMap.entries()) {
    const total = stats.online + stats.offline;
    const uptimePercent = total > 0 ? (stats.online / total) * 100 : 0;
    const avgMs = stats.durations.length > 0
      ? stats.durations.reduce((s, v) => s + v, 0) / stats.durations.length
      : 0;
    const minMs = stats.durations.length > 0 ? Math.min(...stats.durations) : 0;
    const maxMs = stats.durations.length > 0 ? Math.max(...stats.durations) : 0;

    if (!DRY_RUN) {
      await PrismaTimesheet.serverStatusDailySummary.upsert({
        where: { summary_date_server_key: { summary_date: dateStart, server_key: serverKey } },
        create: {
          summary_date: dateStart,
          server_key: serverKey,
          server_name_th: stats.server_name_th,
          total_checks: total,
          online_count: stats.online,
          offline_count: stats.offline,
          uptime_percent: uptimePercent,
          avg_response_time_ms: avgMs,
          min_response_time_ms: minMs,
          max_response_time_ms: maxMs,
        },
        update: {
          server_name_th: stats.server_name_th,
          total_checks: total,
          online_count: stats.online,
          offline_count: stats.offline,
          uptime_percent: uptimePercent,
          avg_response_time_ms: avgMs,
          min_response_time_ms: minMs,
          max_response_time_ms: maxMs,
        },
      });
    }
    rowsCreated++;
  }

  return rowsCreated;
}

// ✨ ลบ log เก่าวันก่อนหน้าออกจาก api_log (เก็บ log วันนี้ไว้)
async function deleteOldLogs(today: Date): Promise<number> {
  const countBefore = await PrismaTimesheet.apiLog.count({
    where: {
      service_name: "SERVER_STATUS_MONITOR",
      request_time: { lt: today },
    },
  });

  if (countBefore === 0) return 0;

  if (DRY_RUN) return countBefore;

  const result = await PrismaTimesheet.apiLog.deleteMany({
    where: {
      service_name: "SERVER_STATUS_MONITOR",
      request_time: { lt: today },
    },
  });

  return result.count;
}

// ✨ จุดเริ่มต้นหลักของ script
async function main() {
  const startTime = Date.now();
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  console.log(SEP);
  console.log(`[SUMMARY-DOWNTIME] เริ่มต้น ${now.toISOString()}${DRY_RUN ? " [DRY RUN]" : ""}`);
  console.log(SEP);

  // --- ขั้นตอนที่ 1: Aggregate ---
  console.log("\n[STEP 1] ตรวจสอบวันที่ที่ยังไม่ได้สรุป...");
  const datesToProcess = await getUnsummarizedDates(today);

  if (datesToProcess.length === 0) {
    console.log("  → ไม่มีวันที่ที่ต้องสรุป (ทุกวันสรุปแล้ว)\n");
  } else {
    console.log(`  → พบ ${datesToProcess.length} วันที่ต้องสรุป`);

    let totalRowsCreated = 0;
    const results: { date: string; rows: number }[] = [];

    for (const date of datesToProcess) {
      const dateStr = date.toISOString().split("T")[0];
      const rows = await aggregateDate(date);
      totalRowsCreated += rows;
      results.push({ date: dateStr, rows });
      console.log(`  ✓ ${dateStr} — ${rows} server(s)${DRY_RUN ? " [DRY RUN — ไม่ได้ write จริง]" : ""}`);
    }

    console.log(`\n  สรุป: ${datesToProcess.length} วัน, ${totalRowsCreated} รายการ`);
  }

  // --- ขั้นตอนที่ 2: Delete old logs ---
  console.log("\n[STEP 2] ลบ log เก่าวันก่อนหน้า...");
  const deletedCount = await deleteOldLogs(today);

  if (deletedCount === 0) {
    console.log("  → ไม่มี log เก่าให้ลบ");
  } else {
    console.log(`  ✓ ลบ log ${deletedCount} รายการ${DRY_RUN ? " [DRY RUN — ไม่ได้ลบจริง]" : ""}`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n${SEP}`);
  console.log(`[SUMMARY-DOWNTIME] เสร็จสิ้น ใช้เวลา ${elapsed}s`);
  console.log(SEP);
}

main()
  .catch((err) => {
    console.error("[SUMMARY-DOWNTIME] ERROR:", err);
    process.exit(1);
  })
  .finally(async () => {
    await PrismaTimesheet.$disconnect();
  });
