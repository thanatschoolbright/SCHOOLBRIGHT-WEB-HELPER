import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { handleError } from "@/helpers/controller/handle-error.params";
import { auth } from "@/auth";

// ✨ Schema สำหรับ body ของ POST (สรุป log เป็นรายวัน)
const AggregateBodySchema = z.object({
  target_date: z.string().optional(), // YYYY-MM-DD — ถ้าไม่ส่งจะสรุปวันก่อนหน้าทั้งหมดที่ยังไม่ได้สรุป
});

// ✨ สรุปข้อมูล log การตรวจสอบสถานะ Server จาก api_log เป็น server_status_daily_summary รายวัน
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        errorResponse({ status: 401, message_th: "กรุณาเข้าสู่ระบบ", message_en: "Unauthorized" }),
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = AggregateBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse({ status: 400, message_th: "พารามิเตอร์ไม่ถูกต้อง", message_en: "Invalid parameters" }),
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let datesToProcess: Date[] = [];

    if (parsed.data.target_date) {
      // สรุปเฉพาะวันที่ระบุ
      const target = new Date(parsed.data.target_date);
      target.setHours(0, 0, 0, 0);
      datesToProcess = [target];
    } else {
      // ดึงวันที่ทั้งหมดที่มี log แต่ยังไม่มี summary (ยกเว้นวันนี้ — log วันนี้ยังไม่ครบ)
      const distinctDates = await PrismaTimesheet.$queryRaw<Array<{ log_date: Date }>>`
        SELECT DISTINCT DATE_TRUNC('day', request_time) AS log_date
        FROM api_log
        WHERE service_name = 'SERVER_STATUS_MONITOR'
          AND request_time < ${today}
        ORDER BY log_date ASC
      `;

      // กรองเฉพาะวันที่ยังไม่มี summary
      const existingSummaryDates = await PrismaTimesheet.serverStatusDailySummary.findMany({
        select: { summary_date: true },
        distinct: ["summary_date"],
      });

      const existingSet = new Set(
        existingSummaryDates.map((s) => s.summary_date.toISOString().split("T")[0])
      );

      datesToProcess = distinctDates
        .map((d) => d.log_date)
        .filter((d) => !existingSet.has(new Date(d).toISOString().split("T")[0]));
    }

    if (datesToProcess.length === 0) {
      return NextResponse.json(
        successResponse({
          data: { processed_dates: 0, rows_created: 0 },
          message_th: "ไม่มีข้อมูล log ที่ยังไม่ได้สรุป",
          message_en: "No new log data to aggregate",
        }),
        { status: 200 }
      );
    }

    let totalRowsCreated = 0;

    for (const date of datesToProcess) {
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);

      // ดึง log ทั้งหมดของวันนั้น
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
        const nameThRaw = (log.response_body as any)?.server_name_th ?? key;
        if (!serverMap.has(key)) {
          serverMap.set(key, { server_name_th: nameThRaw, online: 0, offline: 0, durations: [] });
        }
        const entry = serverMap.get(key)!;
        if (log.called_by === "Online") entry.online++;
        else entry.offline++;
        if (log.duration_ms != null) entry.durations.push(log.duration_ms);
      }

      // upsert summary แต่ละ server สำหรับวันนี้
      for (const [serverKey, stats] of serverMap.entries()) {
        const total = stats.online + stats.offline;
        const uptimePercent = total > 0 ? (stats.online / total) * 100 : 0;
        const avgMs = stats.durations.length > 0
          ? stats.durations.reduce((s, v) => s + v, 0) / stats.durations.length
          : 0;
        const minMs = stats.durations.length > 0 ? Math.min(...stats.durations) : 0;
        const maxMs = stats.durations.length > 0 ? Math.max(...stats.durations) : 0;

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

        totalRowsCreated++;
      }
    }

    return NextResponse.json(
      successResponse({
        data: {
          processed_dates: datesToProcess.length,
          rows_created: totalRowsCreated,
          dates: datesToProcess.map((d) => d.toISOString().split("T")[0]),
        },
        message_th: `สรุปข้อมูลสำเร็จ ${datesToProcess.length} วัน รวม ${totalRowsCreated} รายการ`,
        message_en: `Aggregated ${datesToProcess.length} day(s), ${totalRowsCreated} row(s) created`,
      }),
      { status: 200 }
    );
  } catch (err) {
    return handleError(err, "[SERVER_STATUS_LOG_AGGREGATE_ERROR]");
  }
}
